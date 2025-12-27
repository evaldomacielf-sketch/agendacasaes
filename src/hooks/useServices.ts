import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Service {
    id: string;
    name: string;
    description?: string;
    category: string;
    duration_minutes: number;
    price: number;
    image?: string;
    rating?: number;
    review_count?: number;
    is_active?: boolean;
    is_membership?: boolean;
}

const MOCK_SERVICES: Service[] = [
    {
        id: 'mock-1',
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
        id: 'mock-2',
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
        id: 'mock-3',
        name: 'Corte + Barba',
        category: 'Combo',
        description: 'O combo completo para o visual perfeito.',
        duration_minutes: 60,
        price: 70.00,
        rating: 4.9,
        review_count: 200,
    },
    {
        id: 'mock-4',
        name: 'Hidratação Profunda',
        category: 'Tratamento',
        description: 'Recupere o brilho e maciez do seu cabelo.',
        duration_minutes: 40,
        price: 60.00,
        rating: 4.7,
        review_count: 45
    }
];

export const useServices = (tenantId?: string) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchServices();
    }, [tenantId]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            // Filter by tenant if provided
            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }

            const { data, error: err } = await query;

            if (err) {
                // RLS or connection error - fallback to mock
                console.warn('Supabase error fetching services, using mock data:', err.message);
                setServices(MOCK_SERVICES);
                // Don't set error - we have fallback data
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                // No services in DB - use mock for demo
                console.info("No services found in database, using demo data.");
                setServices(MOCK_SERVICES);
            } else {
                setServices(data as Service[]);
            }
        } catch (err: any) {
            console.error('Unexpected error fetching services:', err);
            // Always fallback to mock on any error
            setServices(MOCK_SERVICES);
        } finally {
            setLoading(false);
        }
    };

    return { services, loading, error, refetch: fetchServices };
};

