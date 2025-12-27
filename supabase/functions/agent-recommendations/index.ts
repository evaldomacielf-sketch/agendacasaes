// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-recommendations!");

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

        const { clientId } = await req.json();

        if (!clientId) throw new Error("Missing clientId");

        // 1. Fetch Client Profile & History
        const { data: client } = await supabaseClient.from('clients').select('id, full_name').eq('id', clientId).single();
        const { data: history } = await supabaseClient
            .from('appointments')
            .select('start_time, services(name, category, price)')
            .eq('client_id', clientId)
            .eq('status', 'completed')
            .order('start_time', { ascending: false })
            .limit(10);

        // 2. Fetch Available Services (Catalog)
        // Ideally we filter by tenant_id. Assuming client belongs to same tenant context or we fetch client's tenant.
        // For now, fetch ALL services in the client's tenant.
        // We'll need tenant_id. Let's get it from the client record (if it exists there) or the appointments.
        // Assuming 'clients' has tenant_id.
        const { data: tenantData } = await supabaseClient.from('clients').select('tenant_id').eq('id', clientId).single();
        const tenantId = tenantData?.tenant_id;

        const { data: catalog } = await supabaseClient
            .from('services')
            .select('id, name, description, category, price, duration_minutes')
            .eq('tenant_id', tenantId)
            .eq('status', 'active');

        // 3. Construct Prompt
        const prompt = `
            You are an Expert Beauty Service Recommender.
            
            CLIENT: ${client?.full_name}
            
            HISTORY (Last 10 visits):
            ${JSON.stringify(history?.map((h: any) => h.services?.name))}
            
            SALON CATALOG:
            ${JSON.stringify(catalog?.map((c: any) => ({ id: c.id, name: c.name, category: c.category })))}
            
            TASK:
            Based on the client's history (frequency, types of services used), recommend 3 NEW or COMPLEMENTARY services from the catalog they haven't tried recently or that fit their style.
            
            OUTPUT (JSON Array):
            [
                {
                    "service_id": "UUID",
                    "service_name": "String",
                    "reason": "Personalized reason based on their history (e.g. 'Since you do Color often, try Hydration')"
                }
            ]
        `;

        // 4. Call AI
        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-pro");
        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0].content.parts?.[0].text;

        const cleanJson = text?.replace(/```json/g, '').replace(/```/g, '').trim();
        const recommendations = JSON.parse(cleanJson || '[]');

        return new Response(JSON.stringify({ recommendations }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
