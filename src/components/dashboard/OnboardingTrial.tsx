import React from 'react';

const OnboardingTrial: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-2xl border border-primary/20">
                <div className="text-primary mb-4">
                    <span className="material-symbols-outlined text-5xl">auto_awesome</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Bem-vindo ao seu Trial!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Você tem 30 dias para explorar nossa **IA Antigravity**. Experimente dizer:
                    <span className="italic block mt-2 text-primary font-medium">"Organize minha agenda de amanhã para focar em cortes químicos."</span>
                </p>
                <div className="space-y-3">
                    <button onClick={onDismiss} className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">
                        Começar a Usar
                    </button>
                    <p className="text-center text-xs text-gray-400">Restam 29 dias de teste gratuito.</p>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTrial;
