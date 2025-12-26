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

            const { data, error: err } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true });

            if (err) throw err;

            // Enhance data with calculated tags
            const enhancedClients = (data as Client[] || []).map(client => {
                const tags = client.tags || [];
                const now = new Date();
                const lastVisit = client.last_visit_at ? new Date(client.last_visit_at) : null;

                // Risk Logic: No visit in 30 days
                if (lastVisit) {
                    const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 30 && !tags.includes('risk')) {
                        tags.push('risk');
                    }
                    // Loyalty Logic: Visited recently
                    if (diffDays <= 30 && !tags.includes('active')) {
                        tags.push('active');
                    }
                } else {
                    if (!tags.includes('new')) tags.push('new');
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

    return { clients, loading, error, refetch: fetchClients };
};
