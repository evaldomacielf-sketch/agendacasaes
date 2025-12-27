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

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            // Get Tenant
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile?.tenant_id) return;
            const tenantId = profile.tenant_id;

            const { data, error: err } = await supabase
                .from('clients')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });

            if (err) throw err;

            // Enhance data with calculated tags (Logic kept)
            const enhancedClients = (data as Client[] || []).map(client => {
                const tags = client.tags || [];
                const now = new Date();
                const lastVisit = client.last_visit_at ? new Date(client.last_visit_at) : null;
                // ... (Existing Tag Logic Logic simplified for brevity or we can keep it)
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
                .select('*, service:services(*), staff:staff_id(*)') // simplified relation, assuming staff_id links to profiles
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile?.tenant_id) throw new Error('Tenant não encontrado');

            const { data, error } = await supabase.from('clients').insert({
                tenant_id: profile.tenant_id,
                full_name: clientData.name,
                phone: clientData.phone,
                email: clientData.email || null,
                notes: clientData.notes || null
            }).select('id').single();

            if (error) throw error;

            // Refresh list after successful creation
            await fetchClients();
            return { success: true, id: data.id };
        } catch (err: any) {
            console.error('Error creating client:', err);
            return { success: false, error: err.message };
        }
    };

    return { clients, loading, error, refetch: fetchClients, fetchClientHistory, createClient };
};
