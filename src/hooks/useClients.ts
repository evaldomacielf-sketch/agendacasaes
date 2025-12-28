import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    notes: string;
    tags: string[];
    last_visit_at: string;
}

export const useClients = (tenantId?: string | null) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tenantId) {
            fetchClients();
        } else {
            setLoading(false);
        }
    }, [tenantId]);

    const fetchClients = async () => {
        if (!tenantId) {
            setError('Tenant não configurado');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('clients')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });

            if (err) throw err;

            // Enhance data with calculated tags
            const enhancedClients = (data as Client[] || []).map(client => {
                const tags = client.tags || [];
                const now = new Date();
                const lastVisit = client.last_visit_at ? new Date(client.last_visit_at) : null;

                if (lastVisit) {
                    const diffDays = Math.ceil(Math.abs(now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 30 && !tags.includes('risk')) tags.push('risk');
                    if (diffDays <= 30 && !tags.includes('active')) tags.push('active');
                } else if (!tags.includes('new')) {
                    tags.push('new');
                }
                return { ...client, tags };
            });

            setClients(enhancedClients);
        } catch (err: any) {
            console.error('Error fetching clients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientHistory = async (clientId: string) => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*, service:services(*), staff:staff_id(*)')
                .eq('client_id', clientId)
                .order('start_time', { ascending: false });

            if (error) throw error;
            return data;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    const createClient = async (clientData: { name: string; phone: string; email?: string; notes?: string }) => {
        // Debug: Log tenant status
        console.log('[createClient] Called with:', {
            tenantId,
            clientData,
            timestamp: new Date().toISOString()
        });

        if (!tenantId) {
            const errorMsg = 'Erro de configuração: tenant não carregado. Faça logout e login novamente.';
            console.error('[createClient] ERROR: No tenantId available');
            return { success: false, error: errorMsg };
        }

        // Prepare payload - try 'name' column (more common) instead of 'full_name'
        const payload = {
            tenant_id: tenantId,
            name: clientData.name,  // Changed from full_name to name
            phone: clientData.phone,
            email: clientData.email || null,
            notes: clientData.notes || null
        };

        console.log('[createClient] Payload to insert:', payload);

        try {
            const { data, error } = await supabase
                .from('clients')
                .insert(payload)
                .select('id')
                .single();

            if (error) {
                console.error('[createClient] Supabase error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });

                // If 'name' column doesn't exist, try 'full_name'
                if (error.message.includes('column') && error.message.includes('name')) {
                    console.log('[createClient] Retrying with full_name column...');
                    const retryPayload = { ...payload, full_name: payload.name };
                    delete (retryPayload as any).name;

                    const { data: retryData, error: retryError } = await supabase
                        .from('clients')
                        .insert(retryPayload)
                        .select('id')
                        .single();

                    if (retryError) {
                        console.error('[createClient] Retry also failed:', retryError);
                        throw retryError;
                    }

                    await fetchClients();
                    return { success: true, id: retryData.id };
                }

                throw error;
            }

            console.log('[createClient] SUCCESS! Created client:', data);
            await fetchClients();
            return { success: true, id: data.id };
        } catch (err: any) {
            const errorMessage = err.message || 'Erro desconhecido ao criar cliente';
            console.error('[createClient] EXCEPTION:', err);
            return { success: false, error: errorMessage };
        }
    };

    return { clients, loading, error, refetch: fetchClients, fetchClientHistory, createClient };
};

