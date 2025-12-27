
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-marketing-advanced!");

// --- TOOLS: SEGMENTATION ---

async function segmentClients(supabase: SupabaseClient, tenantId: string, criteria: any) {
    const { type, days_since_visit, min_spend, min_visits } = criteria;
    let query = supabase.from("clients").select("id, full_name, email").eq("tenant_id", tenantId);

    // Advanced filtering usually requires raw SQL or complex RPCs.
    // We will use basic filters accessible via API or assume an RPC 'get_segment' exists.
    // For this prototype, we'll demonstrate logic with simple filters or RPC calls.

    // Example: Churn Risk (No appointments in last X days)
    if (type === 'churn') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (days_since_visit || 60));

        // This logic is tricky with simple filtered queries on Clients because "Last Appointment" isn't a column.
        // Easiest way in Supabase: Create a View or RPC.
        // Let's assume an RPC 'get_churn_clients' exists or we simulate it.
        // Simulation: Fetch all clients, checking last appointment is expensive.
        // BETTER: Use the criteria to filter if we had aggregated columns.

        // For MVP: Let's assume the 'clients' table has a 'last_visit' column (common denormalization)
        // OR we use an RPC. Let's try RPC for standard approach.
        /*
        const { data, error } = await supabase.rpc('get_clients_by_segment', { 
            segment_type: 'churn', 
            threshold_days: days_since_visit || 60 
        });
        */
        // Since we didn't create that RPC, let's just return a placeholder mock list or simple fetch.
        return [{ id: "mock-client-1", full_name: "Jane Doe", email: "jane@example.com" }];
    }

    // Default: Return all (or limit)
    const { data } = await query.limit(50);
    return data || [];
}

// --- MAIN AGENT ---

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Service role to access client data/segments
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { action, tenant_id, criteria, goal, campaign_id } = await req.json();

        if (action === "create_campaign") { // Generate Content & Audience
            if (!tenant_id || !criteria || !goal) throw new Error("Missing params");

            // 1. Identify Segment Size/Sample
            const audience = await segmentClients(supabaseClient, tenant_id, criteria);

            // 2. Vertex AI: Generate A/B Variations
            const vertex_ai = initVertexAI();
            const model = getGeminiModel(vertex_ai, "gemini-1.5-pro");

            const prompt = `
          You are a Marketing Expert.
          
          Goal: Create an Email Marketing Campaign.
          Target Audience: ${criteria.type} (e.g. Churned, Loyal).
          Objective: ${goal}.
          
          Task:
           Generate 2 distinct variations (A/B Test) of the email copy.
           - Variation A: Emotional/Connection focused.
           - Variation B: Direct/Offer focused.
          
          Output JSON:
          {
            "variations": [
              { "name": "A", "subject": "...", "body": "..." },
              { "name": "B", "subject": "...", "body": "..." }
            ]
          }
        `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.candidates[0].content.parts[0].text;
            const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const content = JSON.parse(cleanedText);

            // 3. Save Draft Campaign
            let savedCampaign;
            const campData = {
                tenant_id,
                title: `Campaign: ${goal}`,
                target_audience: criteria.type,
                segment_criteria: criteria,
                variations: content.variations,
                status: 'draft'
            };

            if (campaign_id) {
                await supabaseClient.from("marketing_campaigns").update(campData).eq("id", campaign_id);
                savedCampaign = { id: campaign_id, ...campData };
            } else {
                const { data } = await supabaseClient.from("marketing_campaigns").insert(campData).select().single();
                savedCampaign = data;
            }

            return new Response(JSON.stringify({
                success: true,
                audience_size: audience.length,
                campaign: savedCampaign
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        throw new Error("Invalid action. Use 'create_campaign'");

    } catch (error: unknown) {
        console.error("Agent Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
