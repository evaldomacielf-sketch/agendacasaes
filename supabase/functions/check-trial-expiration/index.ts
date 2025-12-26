import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar salões com trial expirado
    const { data: expirados, error } = await supabase
        .from('saloes_trial_expirado')
        .select('*')

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    // 2. Loop de envio de e-mails de cobrança
    // Check if expirados is null or empty to avoid errors
    if (!expirados || expirados.length === 0) {
        return new Response(JSON.stringify({ message: "Nenhum salão expirado encontrado.", enviandos: 0 }), { status: 200 })
    }

    const results = await Promise.all(expirados.map(async (salao) => {
        // Only verify if we have the API Key before trying to fetch
        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY not set")
            return { error: "RESEND_API_KEY missing" }
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'financeiro@seusaas.com.br', // Ideally this should also be an env var
                to: salao.email_contato,
                subject: `Seu período de teste no ${salao.nome_salao} expirou!`,
                html: `<strong>Olá!</strong><p>Seu período Trial de 30 dias chegou ao fim. Para continuar usando nossa IA de agendamento, assine agora por apenas <strong>R$ 99,90</strong>/mês.</p>`
            }),
        })
        return res.json()
    }))

    return new Response(JSON.stringify({ message: "Processamento concluído", enviandos: results.length }), { status: 200 })
})
