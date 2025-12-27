import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Star, MoreVertical, Edit, Power, FileText, User, Mail, Phone, Calendar, DollarSign, Clock } from 'lucide-react';

const Professionals = () => {
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedPro, setSelectedPro] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Tenant
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
        if (!profile) return;

        // Fetch from View
        const { data, error } = await supabase
            .from('admin_professionals_view')
            .select('*')
            .eq('tenant_id', profile.tenant_id);

        if (data) setProfessionals(data);
        setLoading(false);
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Profissionais</h1>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    + Novo Profissional
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th className="p-4 text-sm font-medium text-gray-500">Nome</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Especialidades</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Rating</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Agendamentos</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : professionals.map((pro) => (
                            <tr
                                key={pro.id}
                                onClick={() => setSelectedPro(pro)}
                                className={`cursor-pointer transition-colors ${selectedPro?.id === pro.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {pro.photo ? <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-400" />}
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">{pro.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                    {(pro.specialties || []).slice(0, 2).join(', ')}
                                    {(pro.specialties || []).length > 2 && '...'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" />
                                        <span className="text-sm font-medium">{Number(pro.rating || 0).toFixed(1)}/5</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{pro.total_appointments}</td>
                                <td className="p-4 text-right">
                                    <button aria-label="Ações do Profissional" className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail View */}
            {selectedPro && (
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do Profissional</h2>
                            <p className="text-sm text-gray-500">Informações completas de {selectedPro.name}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                                <Edit size={16} /> <span>Editar</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600">
                                <Power size={16} /> <span>Desativar</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-600">
                                <FileText size={16} /> <span>Relatório</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-600">
                                <User size={18} className="text-gray-400" />
                                <span className="font-medium text-gray-900">{selectedPro.name}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Mail size={18} className="text-gray-400" />
                                <span>{selectedPro.email}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Phone size={18} className="text-gray-400" />
                                <span>{selectedPro.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-3 text-gray-600">
                                <Star size={18} className="text-gray-400 mt-1" />
                                <div>
                                    <span className="block mb-1">Especialidades:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedPro.specialties || []).map((s: string) => (
                                            <span key={s} className="bg-gray-100 px-2 py-1 rounded text-xs">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 text-gray-600">
                                <Clock size={18} className="text-gray-400 mt-1" />
                                <div>
                                    <span className="block mb-1">Horário de Trabalho:</span>
                                    <div className="text-sm space-y-1">
                                        {(selectedPro.working_hours || []).map((h: any, i: number) => (
                                            <div key={i} className="flex justify-between w-48">
                                                <span className="font-medium w-16">Dia {h.day}:</span>
                                                <span>{h.start} - {h.end}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <DollarSign size={18} className="text-gray-400" />
                                <span>Comissão: {selectedPro.commission?.value}{selectedPro.commission?.type === 'percentage' ? '%' : ' R$'} por agendamento</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <div className={`w-2 h-2 rounded-full ${selectedPro.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="capitalize">Status: {selectedPro.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Professionals;
