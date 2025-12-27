import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface TimeSlot {
    time: string; // "09:00"
    available: boolean;
}

export const useAvailability = (date: Date, professionalId: string | null, tenantId?: string) => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tenantId) {
            generateSlots();
        }
    }, [date, professionalId, tenantId]);

    const generateSlots = async () => {
        setLoading(true);
        try {
            // 1. Define Range for the selected day
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // 2. Fetch existing appointments
            let query = supabase
                .from('appointments')
                .select('start_time, end_time')
                .eq('tenant_id', tenantId)
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .neq('status', 'cancelled');

            if (professionalId) {
                query = query.eq('staff_id', professionalId);
            }

            const { data: busySlots, error } = await query;

            if (error) throw error;

            // 3. Generate all possible slots (09:00 - 20:00)
            const generated: TimeSlot[] = [];
            const startHour = 9;
            const endHour = 20;

            for (let h = startHour; h < endHour; h++) {
                // :00
                const timeString00 = `${h.toString().padStart(2, '0')}:00`;
                generated.push({
                    time: timeString00,
                    available: !isTimeBusy(timeString00, date, busySlots || [])
                });

                // :30
                const timeString30 = `${h.toString().padStart(2, '0')}:30`;
                generated.push({
                    time: timeString30,
                    available: !isTimeBusy(timeString30, date, busySlots || [])
                });
            }

            setSlots(generated);
        } catch (err) {
            console.error("Error fetching availability:", err);
            // Fallback: Generate random availability for demo if DB fails or empty
            const generated: TimeSlot[] = [];
            for (let h = 9; h < 20; h++) {
                generated.push({ time: `${h}:00`, available: true });
                generated.push({ time: `${h}:30`, available: true });
            }
            setSlots(generated);
        } finally {
            setLoading(false);
        }
    };

    const isTimeBusy = (timeStr: string, dateObj: Date, busySlots: any[]) => {
        const [h, m] = timeStr.split(':').map(Number);
        const slotTime = new Date(dateObj);
        slotTime.setHours(h, m, 0, 0);

        // Check if any existing appointment overlaps this slot (simple logic: start_time matches)
        // A more robust logic would check duration, but for MVP slot matching is usually sufficient if fixed grid.
        return busySlots.some(appt => {
            const apptStart = new Date(appt.start_time);
            return apptStart.getHours() === slotTime.getHours() && apptStart.getMinutes() === slotTime.getMinutes();
        });
    }

    return { slots, loading };
};
