import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Service {
    id: string;
    name: string;
    description?: string;
    category: string;
    duration_minutes: number; // Changed from duration_min to match DB convention mostly
    price: number;
    image?: string;
    rating?: number;
    review_count?: number;
    is_active?: boolean;
    is_membership?: boolean;
}

export const useServices = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('services')
                .select('*')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (err) throw err;

            setServices((data as Service[]) || []);
        } catch (err: any) {
            console.error('Error fetching services:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { services, loading, error, refetch: fetchServices };
};
