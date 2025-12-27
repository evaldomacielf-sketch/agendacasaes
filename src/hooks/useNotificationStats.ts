import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

interface NotificationStats {
    sentLast7Days: number;
    upcomingReminders: Array<{
        id: string;
        scheduled_time: string;
        type: string;
        channels: string[];
        appointment?: {
            id: string;
            start_time: string;
            client?: { name: string };
            service?: { name: string };
        };
    }>;
}

export const useNotificationStats = () => {
    const [stats, setStats] = useState<NotificationStats>({
        sentLast7Days: 0,
        upcomingReminders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Get current user's tenant
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) return;
            const tenantId = profile.tenant_id;

            // 1. Count sent notifications in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: sentCount } = await supabase
                .from('scheduled_reminders')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('status', 'sent')
                .gte('sent_at', sevenDaysAgo.toISOString());

            // 2. Upcoming reminders (pending, scheduled for future)
            const { data: upcoming } = await supabase
                .from('scheduled_reminders')
                .select(`
                    id, scheduled_time, type, channels,
                    appointments:appointment_id (
                        id, start_time,
                        clients:client_id (name),
                        services:service_id (name)
                    )
                `)
                .eq('tenant_id', tenantId)
                .eq('status', 'pending')
                .gte('scheduled_time', new Date().toISOString())
                .order('scheduled_time', { ascending: true })
                .limit(10);

            setStats({
                sentLast7Days: sentCount || 0,
                upcomingReminders: (upcoming || []).map((r: any) => ({
                    ...r,
                    appointment: r.appointments ? {
                        id: r.appointments.id,
                        start_time: r.appointments.start_time,
                        client: r.appointments.clients,
                        service: r.appointments.services
                    } : undefined
                }))
            });

        } catch (err) {
            console.error('Error fetching notification stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading, refetch: fetchStats };
};
