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

export const useServices = (tenantId?: string) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // For public booking page, fetch even without tenantId (will get all active services)
        // For dashboard, filter by tenantId when available
        fetchServices();
    }, [tenantId]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch directly naturally
            let query = supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            // Only filter by tenant if tenantId is provided
            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }

            const { data, error: err } = await query;

            if (err) throw err;

            if (!data || data.length === 0) {
                // Use mock data for demo/fallback
                console.warn("No services found in DB, using mock data for demo.");
                setServices(MOCK_SERVICES);
            } else {
                setServices(data as Service[]);
            }
        } catch (err: any) {
            console.error('Error fetching services:', err);
            // Always fallback to Mock in this MVP demo environment if connection fails
            setError(err.message);
            setServices(MOCK_SERVICES);
        } finally {
            setLoading(false);
        }
    };

    const MOCK_SERVICES: Service[] = [
        {
            id: '1',
            name: 'Corte Degradê',
            category: 'Cabelo',
            description: 'Corte moderno com acabamento na navalha e finalização.',
            duration_minutes: 45,
            price: 45.00,
            rating: 4.8,
            review_count: 120,
            image: 'https://images.unsplash.com/photo-1585747685552-3cfc23d47ae9?auto=format&fit=crop&q=80&w=300&h=300'
        },
        {
            id: '2',
            name: 'Barba Completa',
            category: 'Barba',
            description: 'Barba desenhada com toalha quente e massagem.',
            duration_minutes: 30,
            price: 35.00,
            rating: 4.9,
            review_count: 85,
            image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=300&h=300'
        },
        {
            id: '3',
            name: 'Corte + Barba',
            category: 'Combo',
            description: 'O combo completo para o visual perfeito.',
            duration_minutes: 60,
            price: 70.00,
            rating: 4.9,
            review_count: 200,
        },
        {
            id: '4',
            name: 'Hidratação Profunda',
            category: 'Tratamento',
            description: 'Recupere o brilho e maciez do seu cabelo.',
            duration_minutes: 40,
            price: 60.00,
            rating: 4.7,
            review_count: 45
        }
    ];

    return { services, loading, error, refetch: fetchServices };
};
