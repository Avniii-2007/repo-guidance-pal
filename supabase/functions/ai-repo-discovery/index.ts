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
    const { preferences, level, careerGoals, interests } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("AI repo discovery request:", { preferences, level, careerGoals, interests });

    // Get all repositories with mentors
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: repositories, error: repoError } = await supabase
      .from("repositories")
      .select(`
        *,
        mentor_repositories (
          mentor_id,
          profiles:mentor_id (
            id,
            name,
            profile_pic,
            bio,
            skills
          )
        )
      `)
      .order("stars", { ascending: false });

    if (repoError) {
      console.error("Error fetching repositories:", repoError);
      throw repoError;
    }

    // Format repos for AI context
    const reposContext = repositories.map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stars,
      mentors: repo.mentor_repositories?.map((mr: any) => mr.profiles).filter(Boolean) || []
    }));

    // Call Gemini AI for recommendations
    const systemPrompt = `You are an expert career advisor helping developers find the right open source projects to contribute to. 
Analyze the user's preferences, skill level, career goals, and interests to recommend the most suitable repositories from the provided list.
Consider:
- Their current skill level and how it matches the project complexity
- Their career goals and how contributing to specific projects can help
- Their interests and passions
- The availability of mentors for the projects

Return a JSON array of recommended repository names in order of relevance (most relevant first). Include 3-5 recommendations.
Format: ["repo_name_1", "repo_name_2", "repo_name_3"]`;

    const userPrompt = `User Profile:
- Skill Level: ${level}
- Career Goals: ${careerGoals}
- Interests: ${interests}
- Additional Preferences: ${preferences}

Available Repositories:
${JSON.stringify(reposContext, null, 2)}

Based on this information, recommend the most suitable repositories for this user.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_repositories",
            description: "Return recommended repository names",
            parameters: {
              type: "object",
              properties: {
                repositories: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of recommended repository names"
                },
                reasoning: {
                  type: "string",
                  description: "Brief explanation of why these repos are recommended"
                }
              },
              required: ["repositories", "reasoning"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_repositories" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI API request failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No recommendations received from AI");
    }

    const recommendations = JSON.parse(toolCall.function.arguments);
    console.log("AI recommendations:", recommendations);

    // Filter repositories based on AI recommendations
    const recommendedRepos = repositories
      .filter(repo => recommendations.repositories.includes(repo.name))
      .map(repo => ({
        ...repo,
        mentors: repo.mentor_repositories?.map((mr: any) => mr.profiles).filter(Boolean) || []
      }));

    return new Response(
      JSON.stringify({
        repositories: recommendedRepos,
        reasoning: recommendations.reasoning
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in ai-repo-discovery:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});