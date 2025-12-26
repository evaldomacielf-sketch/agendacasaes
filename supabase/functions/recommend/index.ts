import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// Mock Embedding Generator (In production, use OpenAI or Transformers.js)
// This function returns a random vector of 384 dimensions for demonstration.
function generateMockEmbedding(text: string): number[] {
    // Deterministic-ish to be stable for same text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    const embedding = new Array(384).fill(0).map((_, i) => {
        return Math.sin(hash + i); // pseudo-random derived from text
    });
    return embedding;
}

function diferencaEmDias(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
    try {
        const { query, userId } = await req.json();

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400 });
        }

        // Initialize Supabase Client with Service Role Key to access user data securely
        // In a real app, you might want to use the user's JWT and RLS.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        interface AgentContext {
            plano?: string;
            diasRestantes?: number;
            nome?: string;
        }

        let context: AgentContext = {};
        if (userId) {
            const { data: salao, error: userError } = await supabaseClient
                .from('saloes')
                .select('plano, trial_start_date, nome_salao')
                .eq('user_id', userId) // Assuming user_id refers to the auth user id link
                .single();

            if (!userError && salao) {
                const now = new Date();
                const trialStart = new Date(salao.trial_start_date);
                const diasPassados = diferencaEmDias(now, trialStart);
                const diasRestantes = 30 - diasPassados;

                context = {
                    plano: salao.plano,
                    diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
                    nome: salao.nome_salao
                };
            }
        }

        // 3. Generate System Prompt
        let systemPrompt = `Você é o Assistente Inteligente do ${context.nome || 'Salão'}.`;

        if (context.plano === 'Trial') {
            systemPrompt += `\nCONTEXTO ATUAL: O usuário está no plano TRIAL (Restam ${context.diasRestantes} dias).`;
            systemPrompt += `\nSUA MISSÃO: Sua prioridade é ajudar o salão a faturar mais para que eles assinem a versão Pro.`;
            systemPrompt += `\nDIRETRIZES PROATIVAS:`;
            systemPrompt += `\n- Sempre que o usuário solicitar um agendamento, sugira um 'Upsell' (ex: 'Notei que ela vai fazer corte, que tal sugerir uma hidratação rápida?').`;
            systemPrompt += `\n- Se houver buracos na agenda de amanhã, sugira criar uma campanha de 'Horário de Ouro' com 10% de desconto.`;
            systemPrompt += `\n- Use um tom encorajador e mostre dados (ex: 'Isso pode aumentar seu faturamento diário em R$ 150').`;

            // Simulating Tool Injection (Function Calling definitions)
            systemPrompt += `\n\nFERRAMENTAS DISPONÍVEIS (Use quando apropriado):`;
            systemPrompt += `\n- sugerirCampanhaMarketing({ motivo: string, desconto: number }) -> Cria campanha de e-mail/zap`;
            systemPrompt += `\n- calcularUpsell({ servico_agendado: string }) -> Retorna sugestão complementar rentável`;
        } else {
            // Default/Pro persona
            systemPrompt += `\nSUA MISSÃO: Otimizar a gestão do salão e fornecer insights sobre os dados.`;
        }

        // 1. Generate Embedding
        // const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', ...);
        const embedding = generateMockEmbedding(query);

        // 2. Search via RPC
        const { data, error } = await supabaseClient.rpc('match_services', {
            query_embedding: embedding,
            match_threshold: 0.5, // Lower threshold for mock
            match_count: 5
        });

        if (error) throw error;

        // Simulate Proactive Tip generation based on "Tools"
        let proactiveTip = null;
        if (context.plano === 'Trial') {
            const lowerQuery = query.toLowerCase();

            // 1. Low Occupancy Trigger
            if (lowerQuery.includes('vazio') || lowerQuery.includes('agenda')) {
                proactiveTip = "🚀 Oportunidade: A agenda parece vazia. Que tal disparar uma 'Flash Promo' de 20% para preencher os próximos horários?";
            }
            // 2. New Client Trigger
            else if (lowerQuery.includes('novo') || lowerQuery.includes('cadastro')) {
                proactiveTip = "🌟 Cliente Novo: Sugira o 'Pacote de Fidelidade' (5º corte grátis) para garantir o retorno dele.";
            }
            // 3. High Value Service Trigger
            else if (lowerQuery.includes('mechas') || lowerQuery.includes('progressiva')) {
                proactiveTip = "💎 Alto Valor: Aproveite para oferecer o Kit Home Care de manutenção. Isso aumenta a durabilidade do serviço e seu ticket médio.";
            }
            // Fallback heuristic
            else if (lowerQuery.includes('agendar') || lowerQuery.includes('marcar')) {
                proactiveTip = "💡 Dica Growth: Aproveite para oferecer uma hidratação por +R$ 40. Isso aumenta o ticket médio em 20%.";
            }
        }

        // In a real scenario, you would prepend 'context' to the LLM prompt here.
        // For now, we return it in the response for verification.
        return new Response(JSON.stringify({
            results: data,
            ai_context: context,
            system_instruction: systemPrompt,
            proactive_tip: proactiveTip // New field for UI integration
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
