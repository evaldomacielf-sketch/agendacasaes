import React from 'react';
import * as Sentry from "@sentry/react";

interface AITipCardProps {
    tip: string;
    onDismiss: () => void;
}

const AITipCard: React.FC<AITipCardProps> = ({ tip, onDismiss }) => {
    if (!tip) return null;

    const handleDismiss = () => {
        Sentry.captureMessage('AI Tip Dismissed', {
            level: 'info',
            tags: {
                tip_content: tip.substring(0, 50),
                interaction: 'dismiss'
            }
        });
        onDismiss();
    };

    const handleApply = () => {
        Sentry.captureMessage('AI Tip Accepted', {
            level: 'info',
            tags: {
                tip_content: tip.substring(0, 50),
                interaction: 'apply'
            }
        });
        // In a real app, this would trigger the actual action (e.g. open marketing modal)
        alert("Sugestão aplicada! (Evento enviado ao Sentry)");
        onDismiss();
    };

    return (
        <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 shadow-xl mb-6 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex gap-4 items-start relative z-10">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">
                            auto_awesome
                        </span>
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-sm tracking-wide uppercase">
                                Insight Antigravity
                            </h3>
                            <button
                                onClick={handleDismiss}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <p className="text-slate-700 dark:text-gray-200 text-sm leading-relaxed font-medium">
                            {tip}
                        </p>

                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={handleApply}
                                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                                Aplicar Sugestão <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITipCard;
