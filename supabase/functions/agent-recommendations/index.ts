
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-recommendations-advanced!");

// --- TOOLS ---

async function getClientHistory(supabase: SupabaseClient, clientId: string) {
    const { data, error } = await supabase
        .from("appointments")
        .select("services(name, category), start_time") // Added category if exists
        .eq("client_id", clientId)
        .order("start_time", { ascending: false })
        .limit(10);

    if (error) return [];
    return data.map((d: any) => d.services?.name).filter(Boolean);
}

async function logRecommendation(supabase: SupabaseClient, tenantId: string, clientId: string, serviceId: string, score: number) {
    await supabase.from("recommendation_logs").insert({
        tenant_id: tenantId,
        client_id: clientId,
        service_id: serviceId,
        score: score,
        status: 'shown'
    });
}

// --- MAIN AGENT ---

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { client_id } = await req.json();
        if (!client_id) throw new Error("Missing client_id");

        // 1. Fetch Client Profile & History
        const { data: client } = await supabaseClient
            .from("clients")
            .select("*, saloes(id)")
            .eq("id", client_id)
            .single();

        if (!client) throw new Error("Client not found");

        const history = await getClientHistory(supabaseClient, client_id);
        const tenantId = client.saloes?.id || client.tenant_id;

        // 2. Fetch All Services (Candidate Generation)
        // In a production app with thousands of services, we'd use pgvector 'match_services' here.
        // For this implementation, we fetch active services and let Gemini rank them.
        const { data: services } = await supabaseClient
            .from("services")
            .select("id, name, description, price, duration_minutes")
            .eq("tenant_id", tenantId);

        // 3. Vertex AI Reasoning (Ranking)
        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-1.5-pro");

        const prompt = `
      You are an expert Beauty Salon Recommendation Engine.
      
      Client Profile: ${client.full_name}
      Client History (Past Services): ${JSON.stringify(history)}
      Client Preferences: ${client.notes || "None"}
      
      Available Services:
      ${JSON.stringify(services)}
      
      Task:
      1. Analyze the client's history and preferences.
      2. Identify the Top 3 services they are most likely to book NEXT.
      3. Avoid recommending services they JUST did yesterday (unless it's a recurring thing).
      4. Focus on complementary services (e.g. if they did Color, suggest Hydration).
      
      Output JSON Array:
      [
        { "service_id": "...", "name": "...", "reason": "...", "score": 0.95 }
      ]
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const recommendations = JSON.parse(cleanedText);

        // 4. Log Recommendations for Feedback Loop
        // Process async to not block response? In Deno Edge, best to await or use EdgeRuntime.waitUntil
        for (const rec of recommendations) {
            if (rec.service_id) {
                await logRecommendation(supabaseClient, tenantId, client_id, rec.service_id, rec.score);
            }
        }

        return new Response(JSON.stringify({
            client: client.full_name,
            history_summary: `${history.length} past visits`,
            recommendations
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Agent Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
