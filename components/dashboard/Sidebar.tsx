import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isMobileOpen: boolean;
    onMobileClose: () => void;
    className?: string;
    userRole?: string;
}

const menuItems = [
    { label: 'Visão Geral', icon: 'dashboard', path: '/dashboard' },
    { label: 'Agenda', icon: 'calendar_today', path: '/dashboard/agenda' },
    { label: 'Clientes', icon: 'groups', path: '/dashboard/clients' },
    { label: 'Serviços', icon: 'spa', path: '/dashboard/services' },
    { label: 'Financeiro', icon: 'payments', path: '/dashboard/financial' },
    { label: 'Marketing', icon: 'campaign', path: '/dashboard/marketing' },
    { label: 'Relatórios', icon: 'bar_chart', path: '/dashboard/reports' },
    { label: 'Configurações', icon: 'settings', path: '/dashboard/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({
    isMobileOpen,
    onMobileClose,
    className = ''
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();

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
                    {menuItems.map((item) => {
                        // Check if active (exact match for root /dashboard, or startsWith for others if needed, but here exact paths are distinct enough unless nested further)
                        const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');

                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    navigate(item.path);
                                    onMobileClose();
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled-icon' : ''}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-[#d2e5dd] dark:border-[#2a4035]">
                        <button
                            onClick={async () => {
                                await signOut();
                                navigate('/login');
                                onMobileClose();
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            Sair
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
