import React, { useState } from 'react';
import { NavProps, ScreenName } from '../../../types';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useClients } from '../../hooks/useClients';

const ClientsScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const { clients, loading, error } = useClients();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <DashboardLayout
            currentScreen={ScreenName.DASHBOARD_CLIENTS}
            onNavigate={onNavigate}
            title="Clientes"
        >
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou telefone..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined">person_add</span>
                        <span className="hidden sm:inline">Novo Cliente</span>
                    </button>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nome</th>
                                <th className="px-6 py-3 font-medium">Contato</th>
                                <th className="px-6 py-3 font-medium text-center">Tags</th>
                                <th className="px-6 py-3 font-medium text-right">Última Visita</th>
                                <th className="px-6 py-3 font-medium text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : filteredClients.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum cliente encontrado.</td></tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {client.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <p>{client.phone}</p>
                                            <p className="text-xs opacity-70">{client.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {client.tags?.map(tag => {
                                                    let colorClass = "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300";
                                                    if (tag === 'risk') colorClass = "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
                                                    if (tag === 'vip' || tag === 'active') colorClass = "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
                                                    if (tag === 'new') colorClass = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";

                                                    return (
                                                        <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${colorClass}`}>
                                                            {tag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            {client.last_visit_at ? new Date(client.last_visit_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ClientsScreen;
