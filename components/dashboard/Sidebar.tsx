import React, { useState } from 'react';
import { ScreenName } from '../../types';

interface SidebarProps {
    currentScreen: ScreenName;
    onNavigate: (screen: ScreenName) => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
    className?: string;
    userRole?: string;
}

const menuItems = [
    { label: 'Visão Geral', icon: 'dashboard', target: ScreenName.MAIN_FEATURES },
    { label: 'Agenda', icon: 'calendar_today', target: ScreenName.DASHBOARD_AGENDA },
    { label: 'Clientes', icon: 'groups', target: ScreenName.DASHBOARD_CLIENTS },
    { label: 'Serviços', icon: 'spa', target: ScreenName.DASHBOARD_SERVICES },
    { label: 'Financeiro', icon: 'payments', target: ScreenName.DASHBOARD_FINANCIAL },
    { label: 'Marketing', icon: 'campaign', target: ScreenName.DASHBOARD_MARKETING },
    { label: 'Relatórios', icon: 'bar_chart', target: ScreenName.DASHBOARD_REPORTS },
    { label: 'Configurações', icon: 'settings', target: ScreenName.DASHBOARD_SETTINGS },
];

const Sidebar: React.FC<SidebarProps> = ({
    currentScreen,
    onNavigate,
    isMobileOpen,
    onMobileClose,
    className = ''
}) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar Content */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-surface-dark border-r border-[#d2e5dd] dark:border-[#2a4035] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${className}`}
            >
                <div className="flex h-16 items-center border-b border-[#d2e5dd] dark:border-[#2a4035] px-6">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">spa</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">AgendaCasaES</span>
                    </div>
                    <button
                        className="ml-auto lg:hidden text-slate-500"
                        onClick={onMobileClose}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                onNavigate(item.target);
                                onMobileClose();
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${currentScreen === item.target
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${currentScreen === item.target ? 'filled-icon' : ''}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
