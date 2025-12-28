import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface TimeSlot {
    time: string; // "09:00"
    available: boolean;
}

export const useAvailability = (date: Date, professionalId: string | null, tenantId?: string) => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Always generate slots - with or without tenantId
        generateSlots();
    }, [date, professionalId, tenantId]);

    const generateSlots = async () => {
        setLoading(true);
        console.log('[useAvailability] Generating slots for:', {
            date: date.toISOString(),
            professionalId,
            tenantId
        });

        try {
            // Define working hours: 09:00 - 20:00
            const startHour = 9;
            const endHour = 20;

            // Generate all possible slots first
            const allSlots: TimeSlot[] = [];
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            for (let h = startHour; h < endHour; h++) {
                // :00
                const timeString00 = `${h.toString().padStart(2, '0')}:00`;
                const slot00Time = new Date(date);
                slot00Time.setHours(h, 0, 0, 0);

                // Skip past slots if today
                if (!isToday || slot00Time > now) {
                    allSlots.push({ time: timeString00, available: true });
                }

                // :30
                const timeString30 = `${h.toString().padStart(2, '0')}:30`;
                const slot30Time = new Date(date);
                slot30Time.setHours(h, 30, 0, 0);

                if (!isToday || slot30Time > now) {
                    allSlots.push({ time: timeString30, available: true });
                }
            }

            // If tenantId is available, fetch busy slots to mark as unavailable
            if (tenantId) {
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

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

                if (!error && busySlots) {
                    console.log('[useAvailability] Found busy slots:', busySlots.length);
                    // Mark busy slots as unavailable
                    allSlots.forEach(slot => {
                        if (isTimeBusy(slot.time, date, busySlots)) {
                            slot.available = false;
                        }
                    });
                } else if (error) {
                    console.warn('[useAvailability] Error fetching appointments:', error.message);
                    // Continue with all slots available
                }
            } else {
                console.log('[useAvailability] No tenantId, returning all slots as available');
            }

            console.log('[useAvailability] Generated slots:', allSlots.length);
            setSlots(allSlots);
        } catch (err) {
            console.error("[useAvailability] Error:", err);
            // Fallback: Generate all slots as available
            const generated: TimeSlot[] = [];
            for (let h = 9; h < 20; h++) {
                generated.push({ time: `${h.toString().padStart(2, '0')}:00`, available: true });
                generated.push({ time: `${h.toString().padStart(2, '0')}:30`, available: true });
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

        return busySlots.some(appt => {
            const apptStart = new Date(appt.start_time);
            return apptStart.getHours() === slotTime.getHours() && apptStart.getMinutes() === slotTime.getMinutes();
        });
    }

    return { slots, loading };
};

