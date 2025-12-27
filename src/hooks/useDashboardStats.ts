import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface DashboardStats {
    todayAppointments: number;
    monthRevenue: number;
    occupancyRate: number;
    chartData: { date: string; count: number }[];
    upcomingAppointments: any[];
}

export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        monthRevenue: 0,
        occupancyRate: 0,
        chartData: [],
        upcomingAppointments: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Tenant
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile?.tenant_id) return;
            const tenantId = profile.tenant_id;

            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // 1. Today's Appointments
            const { data: todays, error: err1 } = await supabase
                .from('appointments')
                .select('id, start_time, status, service:services(price), client:clients(name)')
                .eq('tenant_id', tenantId)
                .gte('start_time', startOfDay)
                .lte('start_time', endOfDay)
                .neq('status', 'cancelled');

            if (err1) throw err1;

            const count = todays?.length || 0;

            // 2. Occupancy (Simple estimation: 8h day = 16 slots per pro. If 1 pro, 16 slots. If 2 pros, 32.)
            // For MVP, assume 1 pro = 20 slots/day capacity constant for simplicity or calculate from working hours?
            // Let's use a fixed capacity of 20 slots per day for now for the MVP metric.
            const capacity = 20;
            const occupancy = Math.min(Math.round((count / capacity) * 100), 100);

            // 3. Month Revenue
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const { data: monthAppts } = await supabase
                .from('appointments')
                .select('service:services(price)') // simplified join, taking price from service definition
                .eq('tenant_id', tenantId)
                .gte('start_time', startOfMonth)
                .neq('status', 'cancelled');

            const revenue = monthAppts?.reduce((acc, curr: any) => acc + (curr.service?.price || 0), 0) || 0;

            // 4. Chart Data (Last 30 Days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: history } = await supabase
                .from('appointments')
                .select('start_time')
                .eq('tenant_id', tenantId)
                .gte('start_time', thirtyDaysAgo.toISOString());

            const chartMap = new Map<string, number>();
            history?.forEach(a => {
                const d = new Date(a.start_time).toLocaleDateString('pt-BR'); // DD/MM/YYYY
                // Format as MM/DD for sorting? Or just simplify
                const label = new Date(a.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                chartMap.set(label, (chartMap.get(label) || 0) + 1);
            });

            // Fill gaps? For MVP, just map available days or last 7 days better?
            // Let's take last 7 days for the chart to be clean
            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                chartData.push({ date: label, count: chartMap.get(label) || 0 });
            }

            setStats({
                todayAppointments: count,
                monthRevenue: revenue,
                occupancyRate: occupancy,
                chartData,
                upcomingAppointments: todays?.slice(0, 5) || [] // Limit list
            });

        } catch (e) {
            console.error("Dashboard Stats Error", e);
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading, refetch: fetchStats };
};
