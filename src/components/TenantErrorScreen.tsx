import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface TenantErrorScreenProps {
    error: string;
}

export const TenantErrorScreen: React.FC<TenantErrorScreenProps> = ({ error }) => {
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900 dark:to-primary/10 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                        error_outline
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                    Erro de Configuração
                </h1>

                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {error || 'Sua conta não está vinculada a um estabelecimento. Entre em contato com o suporte para resolver este problema.'}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                    >
                        Tentar Novamente
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-xl transition-colors"
                    >
                        Fazer Logout
                    </button>

                    <a
                        href="mailto:suporte@agendacasaes.com.br?subject=Erro de Tenant"
                        className="block text-primary hover:text-primary-dark font-medium"
                    >
                        Contatar Suporte
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TenantErrorScreen;
