import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import {
    Calendar, Download, DollarSign, Users, Award,
    TrendingUp, TrendingDown, PieChart, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Date State (Defaults to current month)
    const [range, setRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString(),
        label: 'Este Mês'
    });

    useEffect(() => {
        fetchReport();
    }, [range]);

    const fetchReport = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
        if (!profile) return;

        const { data, error } = await supabase.rpc('get_advanced_report', {
            p_tenant_id: profile.tenant_id,
            p_start_date: range.start,
            p_end_date: range.end
        });

        if (error) console.error(error);
        if (data) setReportData(data);
        setLoading(false);
    };

    const setPreset = (type: 'thisMonth' | 'lastMonth' | 'last30') => {
        const now = new Date();
        if (type === 'thisMonth') {
            setRange({
                start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
                label: 'Este Mês'
            });
        } else if (type === 'lastMonth') {
            setRange({
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
                end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
                label: 'Mês Passado'
            });
        }
    };

    if (!reportData && loading) return <div className="p-8 text-center">Gerando Relatório...</div>;

    const summary = reportData?.summary || {};
    const satisfaction = reportData?.clientSatisfaction || {};

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios e Analytics</h1>
                    <p className="text-gray-500">Análise detalhada de performance</p>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-surface-dark p-2 rounded-lg border shadow-sm">
                    <button
                        onClick={() => setPreset('thisMonth')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range.label === 'Este Mês' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Este Mês
                    </button>
                    <button
                        onClick={() => setPreset('lastMonth')}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range.label === 'Mês Passado' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Mês Passado
                    </button>
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">
                        <Download size={14} /> Exportar
                    </button>
                </div>
            </div>

            {reportData && (
                <>
                    {/* Sumário */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">Receita Total</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ {summary.totalRevenue}</h3>
                                </div>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                            </div>
                            <div className="mt-4 text-xs text-gray-500">Ticket Médio: <span className="font-bold">R$ {summary.averageTicket}</span></div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">Agendamentos</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.totalAppointments}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
                            </div>
                            <div className="mt-4 flex gap-3 text-xs">
                                <span className="text-green-600 flex items-center"><Activity size={12} className="mr-1" /> {summary.attendanceRate}% Comparecimento</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">Novos Clientes</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.newClients}</h3>
                                </div>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                            </div>
                            <div className="mt-4 text-xs text-gray-500">Recorrentes: <span className="font-bold">{summary.recurringClients}</span></div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">Satisfação (NPS)</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{satisfaction.averageRating || 0}/5</h3>
                                </div>
                                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Award size={20} /></div>
                            </div>
                            <div className="mt-4 text-xs text-gray-500">{satisfaction.totalReviews || 0} avaliações no período</div>
                        </div>
                    </div>

                    {/* Detailed Charts/Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Service Performance */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900">Performance por Serviço</h3>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="p-3 rounded-l-lg">Serviço</th>
                                            <th className="p-3">Qtd</th>
                                            <th className="p-3 rounded-r-lg text-right">Receita</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(reportData.revenueByService || []).slice(0, 5).map((srv: any, i: number) => (
                                            <tr key={i}>
                                                <td className="p-3 font-medium">{srv.serviceName}</td>
                                                <td className="p-3 text-gray-500">{srv.appointmentCount}</td>
                                                <td className="p-3 text-right font-medium">R$ {srv.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Professional Performance */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900">Performance da Equipe</h3>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="p-3 rounded-l-lg">Profissional</th>
                                            <th className="p-3">Qtd</th>
                                            <th className="p-3 text-right">Comissão</th>
                                            <th className="p-3 rounded-r-lg text-right">Total Gerado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(reportData.revenueByProfessional || []).slice(0, 5).map((pro: any, i: number) => (
                                            <tr key={i}>
                                                <td className="p-3 font-medium">{pro.professionalName}</td>
                                                <td className="p-3 text-gray-500">{pro.appointmentCount}</td>
                                                <td className="p-3 text-right text-gray-500">R$ {Number(pro.commission).toFixed(0)}</td>
                                                <td className="p-3 text-right font-medium text-green-600">R$ {pro.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
