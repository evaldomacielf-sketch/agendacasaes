
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-forecast!");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Get User/Tenant Context
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error('Unauthorized');

        // Fetch tenant_id (assuming metadata or profile lookup, simplified here for now using user query)
        // For MVP, we might trust the RLS or fetch profile.
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        const tenantId = profile?.tenant_id;
        if (!tenantId) throw new Error('Tenant ID not found');

        // 2. Fetch Historical Data (Last 90 Days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: appointments, error: dbError } = await supabaseClient
            .from('appointments')
            .select(`
        start_time,
        status,
        services ( name )
      `)
            .eq('tenant_id', tenantId)
            .gte('start_time', ninetyDaysAgo.toISOString())
            .order('start_time', { ascending: true });

        if (dbError) throw dbError;

        // 3. Aggregate Data
        // Group by Day -> Count, Top Service
        const dailyStats: Record<string, { count: number; services: Record<string, number> }> = {};

        appointments?.forEach((appt: any) => {
            const day = appt.start_time.split('T')[0]; // YYYY-MM-DD
            if (!dailyStats[day]) {
                dailyStats[day] = { count: 0, services: {} };
            }
            dailyStats[day].count++;

            const serviceName = appt.services?.name || 'Unknown';
            dailyStats[day].services[serviceName] = (dailyStats[day].services[serviceName] || 0) + 1;
        });

        // Format for AI
        const historySummary = Object.entries(dailyStats).map(([date, stats]) => {
            const topService = Object.entries(stats.services)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
            const isoDate = new Date(date);
            const dayOfWeek = isoDate.toLocaleDateString('pt-BR', { weekday: 'long' });
            return `${date} (${dayOfWeek}): ${stats.count} appointments. Top service: ${topService}`;
        }).join('\n');

        // 4. Call Vertex AI (Gemini)
        const vertexAI = await initVertexAI();
        const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
      You are an expert Demand Forecast Agent for a beauty salon.
      
      Analyze the following 90-day appointment history:
      ${historySummary}

      Tasks:
      1. Identify weekly patterns (e.g., "Mondays are slow", "Saturdays are full").
      2. Predict the demand for the NEXT 14 DAYS starting from today (${new Date().toISOString().split('T')[0]}).
      3. Recommend staffing or promotions based on the forecast.

      Return ONLY a JSON object with this structure:
      {
        "patterns": ["pattern 1", "pattern 2"],
        "forecast": [
          { "date": "YYYY-MM-DD", "predicted_count": number, "reasoning": "string" }
        ],
        "recommendations": [
          { "type": "staffing" | "promotion", "message": "string" }
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Simple cleanup to ensure JSON parsing (Gemini sometimes wraps in markdown blocks)
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const forecastData = JSON.parse(jsonString);

        return new Response(
            JSON.stringify(forecastData),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error: unknown) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});
