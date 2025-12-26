import React from 'react';
import { NavProps, ScreenName } from '../../types';

const FAQScreen: React.FC<NavProps> = ({ onNavigate }) => {
    return (
        <div className="relative flex flex-col min-h-screen w-full bg-background-light dark:bg-background-dark">
            <nav className="sticky top-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 border-b border-gray-200 dark:border-gray-800 justify-between">
                <button onClick={() => onNavigate(ScreenName.LANDING)} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-start">
                    <span className="material-symbols-outlined text-[28px]">menu</span>
                </button>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold flex-1 text-center">AgendaCasaES</h2>
                <button onClick={() => onNavigate(ScreenName.LOGIN)} className="text-primary font-bold">Entrar</button>
            </nav>

            <section className="flex flex-col w-full py-8 max-w-3xl mx-auto">
                <div className="px-4 text-center pb-6">
                    <span className="text-primary font-semibold text-sm tracking-wider uppercase mb-2 block">Suporte</span>
                    <h2 className="text-slate-900 dark:text-white text-3xl font-bold">Tire suas dúvidas</h2>
                    <p className="mt-3 text-slate-500 dark:text-gray-400">Confira as perguntas mais frequentes sobre nossa plataforma.</p>
                </div>

                <div className="flex flex-col px-4 gap-3">
                    {[
                        { q: "Consigo controlar o estoque?", a: "Sim! O AgendaCasaES possui um módulo de estoque integrado. A cada serviço realizado, os produtos utilizados são automaticamente descontados." },
                        { q: "O sistema ajuda a reduzir faltas?", a: "Com certeza. Nossa plataforma envia lembretes automáticos via WhatsApp e SMS, reduzindo o no-show em até 30%." },
                        { q: "Posso acompanhar o desempenho financeiro?", a: "Absolutamente. Tenha acesso a painéis completos com relatórios de faturamento, comissões e lucro líquido." },
                        { q: "Tem aplicativo para meus profissionais?", a: "Sim, oferecemos um aplicativo exclusivo para profissionais visualizarem agenda e comissões." },
                        { q: "Como funciona o teste grátis?", a: "Você tem 7 dias para testar todas as funcionalidades do plano Premium sem nenhum custo. Não exigimos cartão de crédito." }
                    ].map((item, i) => (
                        <details key={i} className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:shadow-md transition-all">
                            <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 select-none list-none">
                                <p className="text-slate-900 dark:text-white font-semibold">{item.q}</p>
                                <span className="material-symbols-outlined text-gray-500 group-open:rotate-180 group-open:text-primary transition-transform">expand_more</span>
                            </summary>
                            <div className="px-5 pb-5 pt-0">
                                <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{item.a}</p>
                            </div>
                        </details>
                    ))}
                </div>
            </section>

            <section className="w-full py-12 px-6 flex flex-col items-center text-center gap-6">
                <h1 className="text-slate-900 dark:text-white text-3xl font-bold max-w-2xl">Pronto para transformar seu negócio?</h1>
                <p className="text-slate-600 dark:text-gray-300 max-w-lg">Junte-se a mais de 5.000 salões e barbearias que crescem com a AgendaCasaES. Teste grátis por 7 dias.</p>
                <button onClick={() => onNavigate(ScreenName.SIGNUP)} className="w-full max-w-xs h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-colors">Comece Grátis Agora</button>
                <p className="text-xs text-gray-500">Sem cartão de crédito • Cancelamento a qualquer momento</p>
            </section>

            <footer className="mt-auto bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 pt-12 pb-8 px-6">
                <div className="max-w-3xl mx-auto flex flex-col gap-10">
                    <div className="flex flex-col gap-4 items-start">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center size-8 bg-primary/10 rounded-lg text-primary">
                                <span className="material-symbols-outlined">calendar_month</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">AgendaCasaES</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs">A solução completa para gestão de beleza e estética.</p>
                        <div className="flex gap-4 mt-2">
                            {['f', 'in', 'li'].map((s, i) => (
                                <div key={i} className="size-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 hover:text-primary cursor-pointer">{s}</div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-3">
                            <h4 className="font-bold text-sm uppercase text-slate-900 dark:text-white">Institucional</h4>
                            {['Sobre Nós', 'Blog', 'Carreiras'].map(l => <a key={l} href="#" className="text-sm text-slate-500 hover:text-primary">{l}</a>)}
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="font-bold text-sm uppercase text-slate-900 dark:text-white">Suporte</h4>
                            {['Central de Ajuda', 'Termos de Uso', 'Política de Privacidade'].map(l => <a key={l} href="#" className="text-sm text-slate-500 hover:text-primary">{l}</a>)}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 items-center text-center">
                        <div className="flex items-center gap-1 text-gray-400 text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[16px]">lock</span> Site Seguro (SSL)
                        </div>
                        <p className="text-gray-400 text-xs">© 2024 AgendaCasaES. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default FAQScreen;