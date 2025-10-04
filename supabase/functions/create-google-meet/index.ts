import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, topic, duration, startTime } = await req.json();
    
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }

    console.log("Creating Google Meet for session:", sessionId);

    // Create a Google Calendar event with Google Meet
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + (duration || 60) * 60000);

    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: topic || "Mentorship Session",
          description: "Mentorship session scheduled via OpenFuse",
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: "UTC",
          },
          conferenceData: {
            createRequest: {
              requestId: `mentormatch-${sessionId}`,
              conferenceSolutionKey: {
                type: "hangoutsMeet"
              }
            }
          },
          attendees: [],
        }),
      }
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error("Google Calendar API error:", errorText);
      throw new Error("Failed to create Google Meet meeting");
    }

    const event = await eventResponse.json();
    const meetLink = event.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === "video"
    )?.uri || event.hangoutLink;

    console.log("Google Meet created:", meetLink);

    // Update session with Google Meet details
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        zoom_meeting_id: event.id,
        zoom_join_url: meetLink,
        zoom_start_url: meetLink,
        status: "approved",
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        meeting_id: event.id,
        join_url: meetLink,
        start_url: meetLink,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-google-meet:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
