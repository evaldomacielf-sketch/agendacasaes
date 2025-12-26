import React from 'react';
import { NavProps, ScreenName } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const MainFeaturesScreen: React.FC<NavProps> = ({ onNavigate }) => {
    return (
        <DashboardLayout
            currentScreen={ScreenName.MAIN_FEATURES}
            onNavigate={onNavigate}
            title="Visão Geral"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Stat Cards Placeholder */}
                {['Agendamentos', 'Faturamento', 'Novos Clientes', 'Taxa de Retorno'].map((stat) => (
                    <div key={stat} className="bg-white dark:bg-surface-dark border border-[#d2e5dd] dark:border-[#2a4035] p-5 rounded-2xl shadow-sm">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat}</h3>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">--</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-surface-dark border border-[#d2e5dd] dark:border-[#2a4035] rounded-2xl p-6 shadow-sm min-h-[400px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <span className="material-symbols-outlined text-[48px] mb-2">bar_chart</span>
                    <p>Gráficos de desempenho aparecerão aqui (Fase 3)</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MainFeaturesScreen;