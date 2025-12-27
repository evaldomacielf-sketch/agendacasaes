import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface DailyMetric {
    date: string;
    revenue: number;
    appointments: number;
}

export interface ServicePerformance {
    name: string;
    count: number;
    revenue: number;
}

export const useReports = () => {
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [topServices, setTopServices] = useState<ServicePerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            setLoading(true);

            // Fetch last 30 days of appointments and transactions
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: appointments } = await supabase
                .from('appointments')
                .select('created_at, start_time, service:service_id(name, price)')
                .gte('start_time', thirtyDaysAgo.toISOString());

            // Aggregate Daily
            const dailyMap: Record<string, DailyMetric> = {};
            const serviceMap: Record<string, ServicePerformance> = {};

            (appointments || []).forEach((appt: any) => {
                const date = appt.start_time.split('T')[0];
                const price = appt.service?.price || 0;
                const serviceName = appt.service?.name || 'Desconhecido';

                // Daily Params
                if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, appointments: 0 };
                dailyMap[date].revenue += price;
                dailyMap[date].appointments += 1;

                // Service Params
                if (!serviceMap[serviceName]) serviceMap[serviceName] = { name: serviceName, count: 0, revenue: 0 };
                serviceMap[serviceName].count += 1;
                serviceMap[serviceName].revenue += price;
            });

            // Convert to Arrays
            const sortedDaily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
            const sortedServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

            setDailyMetrics(sortedDaily);
            setTopServices(sortedServices);

        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    return { dailyMetrics, topServices, loading };
};
