// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-feedback-analytics!");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { tenantId } = await req.json();
        if (!tenantId) throw new Error("Missing tenantId");

        // 1. Fetch Reviews
        const { data: reviews } = await supabaseClient
            .from('reviews')
            .select('comment, service_rating, created_at, services(name), profiles(full_name)') // Reviewer name in profiles? Reviews usually linked to Appointments->Client
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(50); // Analyze last 50 for trends

        if (!reviews || reviews.length === 0) {
            return new Response(JSON.stringify({ message: "No reviews to analyze" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. Prompt
        const prompt = `
            You are a Feedback Analyst for a Beauty Salon.
            Analyze the following 50 recent reviews and provide a strategic summary.
            
            REVIEWS:
            ${JSON.stringify(reviews.map((r: any) => `(${r.service_rating}/5) ${r.services?.name}: ${r.comment || 'No comment'}`))}
            
            OUTPUT (JSON):
            {
                "sentiment": "Positive" | "Neutral" | "Negative",
                "score": 0-100,
                "topics": ["list", "of", "main", "topics"],
                "issues": ["list", "of", "complaints"],
                "strengths": ["list", "of", "praises"],
                "suggestions": ["Actionable advice for the manager"],
                "alerts": [ {"severity": "High" | "Medium", "message": "Critical issue details"} ]
            }
        `;

        // 3. Call AI
        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-pro");
        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0].content.parts?.[0].text;

        const cleanJson = text?.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(cleanJson || '{}');

        return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
