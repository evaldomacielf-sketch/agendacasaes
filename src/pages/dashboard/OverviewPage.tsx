import React, { useMemo, useRef, useEffect } from 'react';
import { NavProps } from '../types';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';

// Progress bar component using ref to avoid inline styles
const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (barRef.current) {
            barRef.current.style.width = `${value}%`;
        }
    }, [value]);

    return (
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div ref={barRef} className="bg-orange-500 h-full rounded-full transition-all duration-300"></div>
        </div>
    );
};

const OverviewPage: React.FC<NavProps> = ({ onNavigate }) => {
    const { stats, loading } = useDashboardStats();

    // Format currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visão Geral</h1>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                    {/* Decoration */}
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-primary/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-0 transition-transform"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">+12%</span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Agendamentos Hoje</h3>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.todayAppointments}</p>
                        <p className="text-xs text-gray-400 mt-1">Total de sessões agendadas</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-green-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-0 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="material-symbols-outlined text-green-600 text-xl">payments</span>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">+5%</span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Faturamento (Mês)</h3>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.monthRevenue)}</p>
                        <p className="text-xs text-gray-400 mt-1">Baseado em serviços finalizados/agendados</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-orange-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-0 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <span className="material-symbols-outlined text-orange-600 text-xl">percent</span>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Hoje</span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Ocupação</h3>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.occupancyRate}%</p>
                        {/* Progress Bar */}
                        <ProgressBar value={stats.occupancyRate} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Volume de Agendamentos (30 dias)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Upcoming List */}
                <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Próximos Hoje</h3>
                    <div className="space-y-4">
                        {stats.upcomingAppointments.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-10">Sem mais agendamentos hoje.</p>
                        ) : (
                            stats.upcomingAppointments.map((appt: any) => (
                                <div key={appt.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-lg min-w-[3rem]">
                                        <span className="text-xs font-bold text-gray-500">{new Date(appt.start_time).getHours().toString().padStart(2, '0')}:{new Date(appt.start_time).getMinutes().toString().padStart(2, '0')}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{appt.client?.name || 'Cliente'}</p>
                                        <p className="text-xs text-gray-500 truncate">{appt.service?.price ? formatCurrency(appt.service.price) : 'Serviço'}</p>
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                        Confirmado
                                    </div>
                                </div>
                            ))
                        )}
                        <button className="w-full text-center text-sm font-semibold text-primary mt-2 hover:underline">
                            Ver Agenda Completa
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NotificationsPanel />
            </div>
        </div>
    );
};

export default OverviewPage;