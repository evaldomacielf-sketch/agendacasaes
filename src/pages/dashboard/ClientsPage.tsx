import React, { useState } from 'react';
import { NavProps, ScreenName } from '../../types';

import { useClients } from '../../hooks/useClients';

const ClientsScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const { clients, loading, error, fetchClientHistory, createClient } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [clientHistory, setClientHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // New Client Modal State
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [newClientForm, setNewClientForm] = useState({ name: '', phone: '', email: '', notes: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const handleSelectClient = async (client: any) => {
        setSelectedClient(client);
        setLoadingHistory(true);
        const history = await fetchClientHistory(client.id);
        setClientHistory(history);
        setLoadingHistory(false);
    };

    const handleCreateClient = async () => {
        if (!newClientForm.name.trim() || !newClientForm.phone.trim()) {
            setCreateError('Nome e telefone são obrigatórios');
            return;
        }
        setIsCreating(true);
        setCreateError(null);

        const result = await createClient(newClientForm);

        if (result.success) {
            setShowNewClientModal(false);
            setNewClientForm({ name: '', phone: '', email: '', notes: '' });
        } else {
            setCreateError(result.error || 'Erro ao criar cliente');
        }
        setIsCreating(false);
    };

    return (
        <div className="flex flex-col gap-6 relative">
            {/* ... Existing Search and Header ... */}
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
                <button onClick={() => setShowNewClientModal(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2">
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
                                <tr
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                >
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
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal Component (Inline for MVP) */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                                    {selectedClient.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                                    <div className="flex flex-col text-sm text-gray-500">
                                        <span>{selectedClient.phone}</span>
                                        <span>{selectedClient.email}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Histórico de Visitas</h3>
                            {loadingHistory ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}
                                </div>
                            ) : clientHistory.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado.</p>
                            ) : (
                                <div className="space-y-4">
                                    {clientHistory.map((appt: any) => (
                                        <div key={appt.id} className="flex border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-1">
                                            <div className="w-24 text-sm text-gray-500">
                                                {new Date(appt.start_time).toLocaleDateString()} <br />
                                                {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{appt.service?.name}</p>
                                                <p className="text-xs text-gray-500">com {appt.staff?.full_name || 'Profissional'}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${appt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                            <button className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg">Editar</button>
                            <button onClick={() => setSelectedClient(null)} className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Client Modal */}
            {showNewClientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Cliente</h2>
                            <button onClick={() => setShowNewClientModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {createError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                    {createError}
                                </div>
                            )}

                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                                <input
                                    id="clientName"
                                    type="text"
                                    placeholder="Nome completo"
                                    value={newClientForm.name}
                                    onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone *</label>
                                <input
                                    id="clientPhone"
                                    type="tel"
                                    placeholder="(XX) XXXXX-XXXX"
                                    value={newClientForm.phone}
                                    onChange={(e) => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    id="clientEmail"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={newClientForm.email}
                                    onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                                <textarea
                                    id="clientNotes"
                                    placeholder="Observações sobre o cliente..."
                                    rows={3}
                                    value={newClientForm.notes}
                                    onChange={(e) => setNewClientForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                            <button
                                onClick={() => setShowNewClientModal(false)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateClient}
                                disabled={isCreating}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50"
                            >
                                {isCreating ? 'Salvando...' : 'Salvar Cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsScreen;
