import React from 'react';

interface ErrorFallbackProps {
    error?: Error;
    resetErrorBoundary?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center animate-fade-in-up">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                <span className="material-symbols-outlined text-4xl text-red-500">
                    error
                </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Ops! Algo deu errado.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
                Não foi possível carregar esta seção. Tente recarregar a página.
            </p>
            {error && (
                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs text-left overflow-auto max-w-lg mb-6 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {error.message}
                </pre>
            )}
            <button
                onClick={resetErrorBoundary ? resetErrorBoundary : () => window.location.reload()}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
            >
                Tentar Novamente
            </button>
        </div>
    );
};

export default ErrorFallback;
