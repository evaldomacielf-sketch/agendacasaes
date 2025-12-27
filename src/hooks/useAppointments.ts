import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Appointment {
    id: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'canceled';
    client: { name: string; phone: string } | null;
    service: { name: string; duration: number; price: number } | null;
    professional: { name: string } | null;
    unit_id: string;
    notes?: string;
}

export const useAppointments = (date: Date, tenantId?: string | null, unitId?: string) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, [date, tenantId, unitId]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);

            // Construct start and end of the day
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            let query = supabase
                .from('appointments')
                .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          client:client_id (name, phone),
          service:service_id (name, duration_min, price),
          professional:professional_id (name)
        `)
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .order('start_time', { ascending: true });

            // Filter by tenant if available
            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }

            if (unitId) {
                query = query.eq('unit_id', unitId);
            }

            const { data, error: err } = await query;

            if (err) throw err;

            // Transform data to match interface if necessary 
            // (Supabase returns arrays for joins sometimes, but usually objects for single relations)
            const formattedData: Appointment[] = (data || []).map((item: any) => ({
                id: item.id,
                start_time: item.start_time,
                end_time: item.end_time,
                status: item.status,
                notes: item.notes,
                client: item.client,
                service: item.service ? {
                    name: item.service.name,
                    duration: item.service.duration_min,
                    price: item.service.price
                } : null,
                professional: item.professional,
                unit_id: item.unit_id || '',
            }));

            setAppointments(formattedData);
        } catch (err: any) {
            console.error('Error fetching appointments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createAppointment = async (appointmentData: {
        clientId: string;
        serviceId: string;
        staffId: string;
        startTime: Date;
        endTime: Date;
        notes?: string;
    }) => {
        if (!tenantId) {
            return { success: false, error: 'Erro de configuração: tenant não carregado. Faça logout e login novamente.' };
        }

        try {
            const { data, error } = await supabase.from('appointments').insert({
                tenant_id: tenantId,
                client_id: appointmentData.clientId,
                service_id: appointmentData.serviceId,
                staff_id: appointmentData.staffId,
                start_time: appointmentData.startTime.toISOString(),
                end_time: appointmentData.endTime.toISOString(),
                status: 'scheduled',
                notes: appointmentData.notes || null
            }).select('id').single();

            if (error) throw error;

            // Refresh list
            await fetchAppointments();
            return { success: true, id: data.id };
        } catch (err: any) {
            console.error('Error creating appointment:', err);
            return { success: false, error: err.message };
        }
    };

    return { appointments, loading, error, refetch: fetchAppointments, createAppointment };
};

