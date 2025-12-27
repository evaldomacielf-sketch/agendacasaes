import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface TimeSlot {
    time: string; // "09:00"
    available: boolean;
}

export const useAvailability = (date: Date, professionalId: string | null) => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        generateSlots();
    }, [date, professionalId]);

    const generateSlots = async () => {
        setLoading(true);
        // Mock Logic: Generate 30min slots from 09:00 to 18:00
        // In real app: fetch appointments for the day and exclusions

        const generated: TimeSlot[] = [];
        const startHour = 9;
        const endHour = 18;

        for (let h = startHour; h < endHour; h++) {
            generated.push({ time: `${h.toString().padStart(2, '0')}:00`, available: Math.random() > 0.3 });
            generated.push({ time: `${h.toString().padStart(2, '0')}:30`, available: Math.random() > 0.3 });
        }

        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));

        setSlots(generated);
        setLoading(false);
    };

    return { slots, loading };
};
