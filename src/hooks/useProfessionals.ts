import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Professional {
    id: string;
    full_name: string;
    avatar_url?: string;
    specialties: string[];
    rating: number;
    review_count: number;
    bio?: string;
    working_hours?: { day: number; start: string; end: string }[];
}

export const useProfessionals = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['staff', 'owner', 'manager'])
                .eq('is_active', true);

            if (error) {
                console.warn("Supabase fetch failed, using mock data:", error);
                // Fallback to mock data for development/demo
                setProfessionals(MOCK_PROFESSIONALS);
            } else if (!data || data.length === 0) {
                console.warn("No professionals found, using mock data");
                setProfessionals(MOCK_PROFESSIONALS);
            } else {
                setProfessionals(data as Professional[]);
            }
        } catch (err: any) {
            console.error('Error fetching professionals:', err);
            // Fallback to mock
            setProfessionals(MOCK_PROFESSIONALS);
        } finally {
            setLoading(false);
        }
    };

    return { professionals, loading, error };
};

const MOCK_PROFESSIONALS: Professional[] = [
    { id: '1', full_name: 'Ana Silva', rating: 4.8, review_count: 120, specialties: ['Cabelo', 'Coloração'], avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
    { id: '2', full_name: 'Carlos Santos', rating: 4.7, review_count: 85, specialties: ['Barba', 'Corte'], avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { id: '3', full_name: 'Marina Costa', rating: 4.9, review_count: 210, specialties: ['Manicure', 'Pedicure'], avatar_url: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
];
