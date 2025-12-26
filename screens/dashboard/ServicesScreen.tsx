import React, { useState } from 'react';
import { NavProps, ScreenName } from '../../types';

import { useServices, Service } from '../../hooks/useServices';
import { useAI } from '../../hooks/useAI';

const ServicesScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const { services, loading, error } = useServices();
    const { recommendations, searchServices, loading: aiLoading } = useAI();
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) searchServices(query, services);
    };

    // Group by category
    const groupedServices = services.reduce((acc, service) => {
        const cat = service.category || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(service);
        return acc;
    }, {} as Record<string, Service[]>);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <p className="text-slate-500">Gerencie seu menu de serviços e preços.</p>
                <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span>
                    <span className="hidden sm:inline">Novo Serviço</span>
                </button>
            </div>

            {/* AI Search Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white mb-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        Recomendador Inteligente
                    </h2>
                    <p className="text-indigo-100 mb-4 text-sm">O que o cliente está buscando? A IA encontrará o serviço ideal.</p>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ex: Preciso relaxar as costas e tirar o estresse..."
                            className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/30 transition-all backdrop-blur-sm"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={aiLoading}
                            className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {aiLoading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined">search_spark</span>
                            )}
                            <span className="hidden sm:inline">Buscar</span>
                        </button>
                    </form>

                    {/* AI Results */}
                    {recommendations.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
                            {recommendations.map((rec, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm">{rec.service.name}</span>
                                        <span className="bg-green-400/20 text-green-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-green-400/30">
                                            {(rec.score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p className="text-indigo-100 text-xs line-clamp-2">{rec.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                    Carregando...
                </div>
            ) : Object.keys(groupedServices).length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                    Nenhum serviço cadastrado.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(groupedServices).map(([category, items]: [string, Service[]]) => (
                        <div key={category} className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] overflow-hidden">
                            <div className="bg-slate-50 dark:bg-white/5 px-6 py-3 border-b border-[#d2e5dd] dark:border-[#2a4035]">
                                <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">{category}</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((service) => (
                                    <div key={service.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{service.name}</p>
                                            <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    {service.duration_min} min
                                                </span>
                                                {service.is_membership && (
                                                    <span className="bg-purple-100 text-purple-700 px-1.5 rounded font-bold uppercase tracking-wider text-[10px]">Membership</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-primary">R$ {service.price.toFixed(2)}</span>
                                            <button className="text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServicesScreen;
