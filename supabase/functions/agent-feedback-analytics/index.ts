
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-feedback-analytics!");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // tenant_id from user token
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // In real app, fetch tenant. Mocking fetch or assuming we pass filter.
        // Let's rely on RLS and just query.

        // Parse URL for action: /trends or /insights (simulated via body for now)
        const { action, period_days = 30 } = await req.json(); // action: 'trends' | 'insights'

        if (action === 'trends') {
            // Simple aggregation using SQL/PostgREST
            // Get reviews from last X days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - period_days);

            const { data: reviews, error } = await supabaseClient
                .from("reviews")
                .select("sentiment_score, created_at, rating")
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Group by day or week (basic JS aggregation)
            // ... (Aggregation logic) ...
            // Returning raw data for frontend charting for simplicity
            return new Response(JSON.stringify({ trends: reviews }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });

        } else if (action === 'insights') {
            // AI Analysis of batch reviews
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - period_days);

            const { data: reviews, error } = await supabaseClient
                .from("reviews")
                .select("comment, rating, analysis")
                .gte("created_at", startDate.toISOString())
                .not("comment", "is", null)
                .limit(50); // Analyze max 50 recent comments to fit context

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                return new Response(JSON.stringify({ summary: "No reviews found." }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }

            // Prepare text for LLM
            const reviewsText = reviews.map(r => `[${r.rating}/5] ${r.comment}`).join("\n");

            const vertex_ai = initVertexAI();
            const model = getGeminiModel(vertex_ai, "gemini-1.5-pro");

            const prompt = `
          Analyze these ${reviews.length} customer reviews from the last ${period_days} days.
          
          Reviews:
          ${reviewsText}
          
          Task:
          1. Identify the Top 3 Recurring Themes (Positive + Negative).
          2. Summarize the overall Customer Sentiment.
          3. Provide 3 Concrete Recommendations for management to improve.
          
          Output JSON:
          {
            "sentiment_summary": "...",
            "top_themes": [{"name": "...", "type": "positive/negative", "count": 0}],
            "recommendations": ["..."]
          }
        `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.candidates[0].content.parts[0].text;
            const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const insights = JSON.parse(cleanedText);

            return new Response(JSON.stringify(insights), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        throw new Error("Invalid action. Use 'trends' or 'insights'");

    } catch (error) {
        console.error("Agent analytics Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
