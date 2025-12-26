import React, { useState } from 'react';
import { NavProps, ScreenName } from '../../types';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const SettingsScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const [profile, setProfile] = useState({
        name: 'Studio Glamour',
        email: 'contato@studioglamour.com',
        phone: '(27) 99999-9999'
    });

    const [business, setBusiness] = useState({
        name: 'Studio Glamour',
        address: 'Rua das Flores, 123, Centro',
        city: 'Vitória',
        state: 'ES'
    });

    return (
        <DashboardLayout
            currentScreen={ScreenName.DASHBOARD_SETTINGS}
            onNavigate={onNavigate}
            title="Configurações"
        >
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                {/* Profile Section */}
                <section className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] p-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Perfil e Acesso
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome de Exibição</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Business Section */}
                <section className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] p-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">storefront</span>
                        Dados do Negócio
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Estabelecimento</label>
                            <input
                                type="text"
                                value={business.name}
                                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
                                <input
                                    type="text"
                                    value={business.address}
                                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                                    <input
                                        type="text"
                                        value={business.city}
                                        onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                                    <input
                                        type="text"
                                        value={business.state}
                                        onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-black/20 focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-4 pb-12">
                    <button className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center gap-2">
                        <span className="material-symbols-outlined">save</span>
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsScreen;
