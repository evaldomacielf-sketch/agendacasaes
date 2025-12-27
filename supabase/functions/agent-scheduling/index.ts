
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-scheduling-advanced!");

// --- TOOLS DEFINITION ---

/**
 * Tool: getAvailableSlots
 * Fetches busy times and calculates gaps. 
 * specific logic would go here to subtract busy slots from business hours.
 */
async function getAvailability(supabase: SupabaseClient, tenantId: string, date: string) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: appointments, error } = await supabase
        .from("appointments")
        .select("start_time, end_time, staff_id")
        .eq("tenant_id", tenantId)
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .neq('status', 'cancelled');

    if (error) throw error;
    return appointments;
}

/**
 * Tool: getClientPreferences
 * Fetches manual notes or inferred preferences from profile.
 */
async function getClientPreferences(supabase: SupabaseClient, clientId: string) {
    if (!clientId) return "Unknown client";
    const { data: client, error } = await supabase
        .from("clients")
        .select("notes, preferred_staff_id, preferences") // Assuming 'preferences' column might exist or we use notes
        .eq("id", clientId)
        .single();

    // Fallback if column doesn't exist in current schema, just use notes
    if (error && error.code !== 'PGRST116') console.warn("Pref fetch warning:", error.message);

    return client ? { notes: client.notes, manual_preferences: client.preferences } : "No profile found";
}

/**
 * Tool: getClientHistory
 * Summarizes past services to find patterns (e.g., usually comes at 18:00).
 */
async function getClientHistory(supabase: SupabaseClient, clientId: string) {
    if (!clientId) return [];

    const { data: history, error } = await supabase
        .from("appointments")
        .select("start_time, services(name)")
        .eq("client_id", clientId)
        .order("start_time", { ascending: false })
        .limit(5);

    if (error) return [];
    return history.map((h: any) => ({
        service: h.services?.name,
        time: h.start_time
    }));
}

// --- MAIN AGENT LOGIC ---

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

        const { client_id, service_id, preferred_date, preferences } = await req.json();

        if (!service_id || !preferred_date) {
            throw new Error("Missing required fields: service_id, preferred_date");
        }

        // 1. Gather Context (Run Tools in parallel where possible)
        // First need service details to know tenant and duration
        const { data: service, error: sErr } = await supabaseClient
            .from("services")
            .select("*, saloes(settings)")
            .eq("id", service_id)
            .single();
        if (sErr) throw sErr;

        const tenantId = service.tenant_id;
        const businessHours = service.saloes?.settings?.business_hours || "09:00 - 18:00";

        const [availability, clientHistory, clientProfile] = await Promise.all([
            getAvailability(supabaseClient, tenantId, preferred_date),
            getClientHistory(supabaseClient, client_id),
            getClientPreferences(supabaseClient, client_id)
        ]);

        // 2. Build Prompt for Vertex AI
        // We feed the raw data and let the LLM do the "Reasoning" and "Ranking"
        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-1.5-pro"); // Using 1.5 Pro for better reasoning if available, else standard

        const prompt = `
      You are the "Smart Scheduler" AI Agent for the salon.
      
      OBJECTIVE: Suggest the Top 3 optimal appointment start times.
      
      CONTEXT:
      - Service: ${service.name}
      - Duration: ${service.duration_minutes} minutes
      - Date: ${preferred_date}
      - Business Hours: ${businessHours}
      
      DATA:
      - Existing Appointments (Busy Slots): ${JSON.stringify(availability)}
      - Client History (Past patterns): ${JSON.stringify(clientHistory)}
      - Client Profile/Prefs: ${JSON.stringify(clientProfile)}
      - Request Preferences: ${preferences || "None"}
      
      ALGORITHM:
      1. Identify all valid gaps in the schedule that fit the ${service.duration_minutes} min duration. Do not overlap with existing appointments.
      2. Rank these gaps based on:
         - Match with Client History (e.g. if they usually come at 17:00, prioritize late afternoon).
         - Match with Request Preferences.
         - Optimization: Minimize small unusable gaps between appointments (grouping).
      3. Select the Top 3.
      
      OUTPUT FORMAT:
      Return strictly a JSON array of objects. No markdown.
      Example:
      [
        { "time": "14:00", "score": 95, "reason": "Matches preferred afternoon slot and fits tightly after previous appt." },
        { "time": "10:00", "score": 80, "reason": "Good morning availability." }
      ]
    `;

        // 3. Invoke AI
        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let suggestions;
        try {
            suggestions = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI response", responseText);
            throw new Error("AI Agent failed to generate valid JSON suggestions.");
        }

        return new Response(JSON.stringify({
            success: true,
            service: service.name,
            date: preferred_date,
            suggestions
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        console.error("Agent Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
