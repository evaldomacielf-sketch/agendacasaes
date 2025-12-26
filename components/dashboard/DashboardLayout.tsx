import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { ScreenName } from '../../../types';

interface DashboardLayoutProps {
    children: React.ReactNode;
    currentScreen: ScreenName;
    onNavigate: (screen: ScreenName | string) => void;
    title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    currentScreen,
    onNavigate,
    title
}) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark outline-none">
            <Sidebar
                currentScreen={currentScreen}
                onNavigate={onNavigate}
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-16 items-center justify-between border-b border-[#d2e5dd] dark:border-[#2a4035] bg-white/80 dark:bg-surface-dark/80 px-6 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-1 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {title || 'Visão Geral'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            ES
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
