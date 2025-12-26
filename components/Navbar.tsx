import React from 'react';
import { ScreenName } from '../../types';

interface NavbarProps {
    onNavigate: (screen: ScreenName) => void;
    variant?: 'landing' | 'back' | 'steps';
    title?: string;
    step?: {
        current: number;
        total: number;
        label: string;
        subLabel: string;
    };
    rightAction?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
    onNavigate,
    variant = 'landing',
    title,
    step,
    rightAction
}) => {

    if (variant === 'landing') {
        return (
            <header className="sticky top-0 z-50 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(ScreenName.LANDING)}>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">AgendaCasaES</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {rightAction || (
                            <>
                                <button onClick={() => onNavigate(ScreenName.LOGIN)} className="hidden sm:block text-sm font-semibold text-primary hover:text-primary-dark transition-colors">Entrar</button>
                                <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-slate-700 dark:text-slate-200">
                                    <span className="material-symbols-outlined">menu</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>
        );
    }

    if (variant === 'back') {
        return (
            <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <button onClick={() => onNavigate(ScreenName.LANDING)} className="text-text-main dark:text-white flex size-12 shrink-0 items-center justify-start hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">{title === 'AgendaCasaES' ? 'arrow_back' : 'arrow_back'}</span>
                </button>
                <h2 className="text-text-main dark:text-white text-lg font-bold flex-1 text-center">{title}</h2>
                <div className="flex w-12 items-center justify-end">
                    {rightAction || (
                        <button onClick={() => onNavigate(ScreenName.LOGIN)} className="text-primary text-base font-bold hover:opacity-80">Login</button>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'steps' && step) {
        return (
            <header className="fixed top-0 z-50 w-full bg-surface-light/95 backdrop-blur-sm border-b border-gray-100 dark:bg-background-dark/95 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => onNavigate(ScreenName.LANDING)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-text-main dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold text-text-main dark:text-white flex-1 text-center pr-8">{title || 'Agendamento'}</h1>
                </div>
                <div className="px-4 pb-4">
                    <div className="relative flex items-center justify-between w-full">
                        {/* Progress Bar Background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                        {/* Active Progress Bar */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-500" style={{ width: `${((step.current - 1) / (step.total - 1)) * 100}%` }}></div>

                        {Array.from({ length: step.total }, (_, i) => i + 1).map((s) => {
                            const isActive = s === step.current;
                            const isCompleted = s < step.current;

                            return (
                                <div key={s} className="flex flex-col items-center gap-1">
                                    <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ring-4 ring-white dark:ring-background-dark transition-all ${isActive
                                        ? 'bg-primary text-text-main animate-pulse'
                                        : isCompleted
                                            ? 'bg-primary text-text-main'
                                            : 'bg-white border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-600 text-gray-400 font-medium'
                                        }`}>
                                        {isCompleted ? <span className="material-symbols-outlined text-sm">check</span> : s}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-center">
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">{step.subLabel} {step.current} de {step.total}</p>
                        <p className="text-sm font-bold text-text-main dark:text-white mt-0.5">{step.label}</p>
                    </div>
                </div>
            </header>
        )
    }

    return null;
};

export default Navbar;
