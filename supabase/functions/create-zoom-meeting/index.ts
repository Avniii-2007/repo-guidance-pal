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
    
    const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID");
    const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID");
    const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      throw new Error("Zoom credentials not configured");
    }

    console.log("Creating Zoom meeting for session:", sessionId);

    // Get OAuth token from Zoom
    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Zoom OAuth error:", errorText);
      throw new Error("Failed to authenticate with Zoom");
    }

    const { access_token } = await tokenResponse.json();

    // Create Zoom meeting
    const meetingResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic || "Mentorship Session",
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration: duration || 60,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: false,
          waiting_room: true,
          audio: "voip",
        },
      }),
    });

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text();
      console.error("Zoom meeting creation error:", errorText);
      throw new Error("Failed to create Zoom meeting");
    }

    const meeting = await meetingResponse.json();
    console.log("Zoom meeting created:", meeting.id);

    // Update session with Zoom details
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        zoom_meeting_id: meeting.id.toString(),
        zoom_join_url: meeting.join_url,
        zoom_start_url: meeting.start_url,
        status: "approved",
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        meeting_id: meeting.id,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-zoom-meeting:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});