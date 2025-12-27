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

            // Create a promise that rejects after 5 seconds to force fallback
            const fetchPromise = supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const { data, error: err } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (err) {
                console.warn("Supabase fetch failed (services), using mock data", err);
                // Fallback to mock data
                setServices(MOCK_SERVICES);
            } else if (!data || data.length === 0) {
                console.warn("No services found, using mock data");
                setServices(MOCK_SERVICES);
            } else {
                setServices((data as Service[]) || []);
            }
        } catch (err: any) {
            console.error('Error fetching services:', err);
            // Fallback to mock
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
