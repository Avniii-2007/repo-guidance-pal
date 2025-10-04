import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error("No audio data provided");
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }

    console.log("Transcribing audio with Gemini...");

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Use Gemini API for audio transcription
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Transcribe this audio accurately. Return only the transcribed text without any additional commentary."
              },
              {
                inline_data: {
                  mime_type: "audio/webm",
                  data: audio
                }
              }
            ]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Transcription complete:", text);

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in gemini-transcribe:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
