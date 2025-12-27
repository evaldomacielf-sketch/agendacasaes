
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-marketing!");

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

        const { tenantId, goal } = await req.json(); // goal: "Retention", "New Service Launch", "Holiday"

        // 1. Fetch Client Segments Stats (aggregated)
        const { count: totalClients } = await supabaseClient.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
        // We could fetch real segments here (e.g. "inactive > 30 days")

        // 2. Prompt
        const prompt = `
            You are a Marketing Automation Expert for a Beauty Salon.
            Create a high-conversion Email Marketing Campaign.
            
            GOAL: ${goal || 'General Engagement'}
            AUDIENCE SIZE: ${totalClients} clients
            
            TASK:
            1. Define 2-3 Segments (e.g., 'Lost Clients', 'VIPs').
            2. Write specific Subject Lines and Body Copy for each.
            3. Suggest optimal sending time.
            
            OUTPUT (JSON):
            {
                "campaigns": [
                    {
                        "target_segment": "Segment Name",
                        "criteria": "Description of who fits",
                        "subject": "Email Subject",
                        "body": "Email Body (HTML or Text)",
                        "why_it_works": "Marketing theory behind this",
                        "optimal_time": "Weekday & Time"
                    }
                ]
            }
        `;

        // 3. Call AI
        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-pro");
        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0].content.parts?.[0].text;

        const cleanJson = text?.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultJson = JSON.parse(cleanJson || '{}');

        return new Response(JSON.stringify(resultJson), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
