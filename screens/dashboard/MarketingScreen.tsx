import React, { useState } from 'react';
import { NavProps, ScreenName } from '../../types';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const MarketingScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const [campaigns] = useState([
        { id: 1, name: 'Promoção de Natal', type: 'Email', status: 'Enviada', date: '2024-12-20', reach: 450, conversion: '12%' },
        { id: 2, name: 'Lembrete de Agendamento', type: 'WhatsApp', status: 'Automático', date: 'Recorrente', reach: 120, conversion: '85%' },
        { id: 3, name: 'Desconto Aniversariantes', type: 'SMS', status: 'Ativa', date: 'Recorrente', reach: 50, conversion: '18%' },
    ]);

    return (
        <DashboardLayout
            currentScreen={ScreenName.DASHBOARD_MARKETING}
            onNavigate={onNavigate}
            title="Marketing"
        >
            <div className="flex flex-col gap-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <p className="text-sm font-medium text-slate-500 mb-1">Mensagens Enviadas (Mês)</p>
                        <p className="text-3xl font-bold text-primary">620</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <p className="text-sm font-medium text-slate-500 mb-1">Taxa de Abertura</p>
                        <p className="text-3xl font-bold text-green-600">92%</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <p className="text-sm font-medium text-slate-500 mb-1">Receita Gerada</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">R$ 4.250</p>
                    </div>
                </div>

                {/* Campaigns */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] overflow-hidden">
                    <div className="p-6 border-b border-[#d2e5dd] dark:border-[#2a4035] flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-white">Campanhas e Automações</h3>
                        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2">
                            <span className="material-symbols-outlined">add</span>
                            Nova Campanha
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nome</th>
                                    <th className="px-6 py-3 font-medium">Canal</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Data</th>
                                    <th className="px-6 py-3 font-medium">Alcance</th>
                                    <th className="px-6 py-3 font-medium">Conversão</th>
                                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{campaign.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${campaign.type === 'WhatsApp' ? 'bg-green-100 text-green-700' :
                                                    campaign.type === 'Email' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {campaign.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{campaign.status}</td>
                                        <td className="px-6 py-4 text-slate-500">{campaign.date}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{campaign.reach}</td>
                                        <td className="px-6 py-4 font-bold text-green-600">{campaign.conversion}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MarketingScreen;
