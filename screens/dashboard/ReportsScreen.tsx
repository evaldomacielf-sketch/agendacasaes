import React from 'react';
import { NavProps, ScreenName } from '../../../types';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useReports } from '../../hooks/useReports';

const ReportsScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const { dailyMetrics, topServices, loading } = useReports();

    // Determine max values for scaling charts
    const maxRevenue = Math.max(...dailyMetrics.map(d => d.revenue), 100);

    return (
        <DashboardLayout
            currentScreen={ScreenName.DASHBOARD_REPORTS}
            onNavigate={onNavigate}
            title="Relatórios & Métricas"
        >
            <div className="flex flex-col gap-8">
                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Receita Total (30d)', value: `R$ ${dailyMetrics.reduce((a, b) => a + b.revenue, 0).toFixed(2)}`, color: 'text-green-600' },
                        { label: 'Agendamentos', value: dailyMetrics.reduce((a, b) => a + b.appointments, 0), color: 'text-primary' },
                        { label: 'Ticket Médio', value: 'R$ 0,00', color: 'text-slate-900 dark:text-white' }, // Placeholder calc
                        { label: 'Taxa de Retenção', value: '85%', color: 'text-purple-600' }, // Placeholder
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Trend Chart */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6">Tendência de Receita (Últimos 30 dias)</h3>
                        {loading ? (
                            <div className="h-48 flex items-center justify-center text-slate-400">Carregando...</div>
                        ) : (
                            <div className="flex items-end gap-2 h-48">
                                {dailyMetrics.map((day) => (
                                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div
                                            className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-sm relative"
                                            style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                R${day.revenue}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 rotate-90 origin-left translate-y-4 w-4">{day.date.split('-')[2]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Services */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6">Serviços Mais Rentáveis</h3>
                        <div className="flex flex-col gap-4">
                            {loading ? (
                                <p className="text-slate-400">Carregando...</p>
                            ) : topServices.length === 0 ? (
                                <p className="text-slate-400">Sem dados.</p>
                            ) : (
                                topServices.map((service, i) => (
                                    <div key={service.name} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-slate-500">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-800 dark:text-white">{service.name}</span>
                                                <span className="text-slate-500">R$ {service.revenue.toFixed(2)}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${(service.revenue / (topServices[0]?.revenue || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReportsScreen;
