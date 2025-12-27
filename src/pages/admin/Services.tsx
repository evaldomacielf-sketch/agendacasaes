import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Star, MoreVertical, Edit, Power, Eye, Clock, DollarSign, Tag, Scissors } from 'lucide-react';

const Services = () => {
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
        if (!profile) return;

        const { data, error } = await supabase
            .from('admin_services_view')
            .select('*')
            .eq('tenant_id', profile.tenant_id);

        if (data) setServices(data);
        setLoading(false);
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Serviços</h1>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    + Novo Serviço
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th className="p-4 text-sm font-medium text-gray-500">Serviço</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Duração</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Preço</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Rating</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Agendamentos</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : services.map((svc) => (
                            <tr
                                key={svc.id}
                                onClick={() => setSelectedService(svc)}
                                className={`cursor-pointer transition-colors ${selectedService?.id === svc.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <td className="p-4 font-medium text-gray-900 dark:text-gray-200">{svc.name}</td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{svc.duration} min</td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">R$ {svc.price}</td>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" />
                                        <span className="text-sm font-medium">{Number(svc.rating || 0).toFixed(1)}/5</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{svc.total_appointments}</td>
                                <td className="p-4 text-right">
                                    <button aria-label="Ações do Serviço" className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedService && (
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do Serviço</h2>
                            <p className="text-sm text-gray-500">Informações de {selectedService.name}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                                <Edit size={16} /> <span>Editar</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600">
                                <Power size={16} /> <span>Desativar</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-600">
                                <Eye size={16} /> <span>Ver Avaliações</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Scissors size={18} className="text-gray-400" />
                                <span className="font-medium text-gray-900">{selectedService.name}</span>
                            </div>
                            <div className="text-sm text-gray-500 pl-8">
                                {selectedService.description || "Sem descrição."}
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Clock size={18} className="text-gray-400" />
                                <span>{selectedService.duration} minutos</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <DollarSign size={18} className="text-gray-400" />
                                <span>R$ {Number(selectedService.price).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-600">
                                <Tag size={18} className="text-gray-400" />
                                <span>Categoria: {selectedService.category}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-600">
                                <div className={`w-2 h-2 rounded-full ${selectedService.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="capitalize">Status: {selectedService.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Services;
