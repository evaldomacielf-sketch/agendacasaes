import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'; // We might need to create these or use raw div
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, CheckCircle, Clock, AlertCircle, DollarSign, Users, TrendingUp } from 'lucide-react';

// Mock UI Components if not present (inline for simplicity in this agent step)
const MetricCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold mt-2 text-text-main dark:text-white">{value}</h3>
            {subtext && <p className={`text-xs mt-1 ${color}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

const Dashboard = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [revenue, setRevenue] = useState<any>(null);
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // You would typically get this from Auth Context
    const [tenantId, setTenantId] = useState<string | null>(null);

    useEffect(() => {
        // Determine Tenant and Fetch
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Tenant ID (simplified query)
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (profile) {
                setTenantId(profile.tenant_id);
                fetchData(profile.tenant_id);
            }
        };
        init();

        // Auto-refresh
        const interval = setInterval(() => {
            if (tenantId) fetchData(tenantId);
        }, 30000);
        return () => clearInterval(interval);
    }, [tenantId]);

    const fetchData = async (tid: string) => {
        try {
            setLoading(true);
            // 1. Daily Metrics
            const { data: metricData, error: mErr } = await supabase.rpc('get_daily_metrics', { p_tenant_id: tid });
            if (metricData) setMetrics(metricData);

            // 2. Revenue Metrics
            const { data: revData, error: rErr } = await supabase.rpc('get_revenue_metrics', { p_tenant_id: tid });
            if (revData) setRevenue(revData);

            // 3. Today's Appointments
            const { data: apps, error: aErr } = await supabase
                .from('appointments')
                .select('id, start_time, status, services(name), clients(full_name), profiles(full_name)')
                .eq('tenant_id', tid)
                // .filter('start_time', 'gte', todayStart) // Simplified for agent
                .order('start_time', { ascending: true })
                .limit(10);

            // Filter purely for today in client or RPC. RPC is better but let's do JS for flexibility here.
            const today = new Date().toDateString();
            const todaysApps = (apps || []).filter(a => new Date(a.start_time).toDateString() === today);
            setTodayAppointments(todaysApps);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!metrics && loading) return <div className="p-8 text-center">Carregando Dashboard...</div>;

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
                <div className="text-sm text-gray-500">Última atualização: {new Date().toLocaleTimeString()}</div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Agendados Hoje"
                    value={metrics?.scheduled || 0}
                    icon={Calendar}
                    color="text-blue-600"
                />
                <MetricCard
                    title="Confirmados"
                    value={metrics?.confirmed || 0}
                    icon={CheckCircle}
                    color="text-green-600"
                />
                <MetricCard
                    title="Completados"
                    value={metrics?.completed || 0}
                    icon={Users}
                    color="text-purple-600"
                />
                <MetricCard
                    title="No-Shows"
                    value={metrics?.noShows || 0}
                    icon={AlertCircle}
                    color="text-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Faturamento (Mensal)</h3>
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <TrendingUp size={16} />
                            <span className="text-sm font-bold">+{revenue?.growth || 0}%</span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Semana 1', value: 4000 },
                                { name: 'Semana 2', value: 3000 },
                                { name: 'Semana 3', value: 2000 }, // Mock data for visual structure
                                { name: 'Semana 4', value: 2780 },
                                { name: 'Atual', value: revenue?.month || 0 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6 border-t pt-6">
                        <div>
                            <p className="text-xs text-gray-500">Hoje</p>
                            <p className="text-lg font-bold">R$ {revenue?.today || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Esta Semana</p>
                            <p className="text-lg font-bold">R$ {revenue?.week || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Este Mês</p>
                            <p className="text-lg font-bold text-indigo-600">R$ {revenue?.month || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Today's Agenda List */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Agenda de Hoje</h3>
                    <div className="space-y-4">
                        {todayAppointments.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">Nenhum agendamento para hoje.</p>
                        ) : todayAppointments.map((app) => (
                            <div key={app.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg font-bold text-xs">
                                        {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{app.clients?.full_name}</p>
                                        <p className="text-xs text-gray-500">{app.services?.name}</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${app.status === 'confirmed' ? 'bg-green-500' :
                                        app.status === 'completed' ? 'bg-purple-500' :
                                            app.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                        Ver Agenda Completa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
