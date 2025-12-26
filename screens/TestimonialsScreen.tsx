import React from 'react';
import { NavProps, ScreenName } from '../types';

const TestimonialsScreen: React.FC<NavProps> = ({ onNavigate }) => {
    return (
        <div className="relative flex flex-col min-h-screen w-full bg-background-light dark:bg-background-dark">
            <header className="sticky top-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
                <h2 onClick={() => onNavigate(ScreenName.LANDING)} className="text-slate-900 dark:text-white text-lg font-bold flex-1 cursor-pointer">AgendaCasaES</h2>
                <div className="flex items-center justify-end gap-2">
                    <button className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-gray-100 dark:hover:bg-white/5">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center w-full max-w-md mx-auto pb-24">
                <section className="w-full pt-8 pb-4 px-6 text-center">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold">Aprovado por grandes profissionais</h1>
                </section>

                <section className="w-full px-6 pb-6 text-center">
                    <p className="text-slate-600 dark:text-gray-400">Veja como o AgendaCasaES transforma o dia a dia de salões, barbearias e clínicas.</p>
                </section>

                <section className="w-full px-4 pb-8">
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Menos Faltas', 'Clareza Financeira', 'Economia de Tempo'].map((badge, i) => (
                            <div key={i} className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-primary/10 border border-primary/20 px-4">
                                <span className="material-symbols-outlined text-primary text-[18px] filled-icon">check_circle</span>
                                <p className="text-primary text-sm font-semibold">{badge}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full px-4 flex flex-col gap-5">
                    {[
                        { name: 'Mariana', role: 'Studio Glow Hair', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqYOD7yS0xlUjeYEEnFiJm5VBUr-AFkQVhO9ONxtJlDILFGmZ57lDvcl4zlJH4RtEHqcB6216geDeS9meF7ZdrQTOJyuzPa5u7IIn6d48T5tqJM4uxLlYQeGuuYQs8SKr6b_C63TFmNk7gcXeNjHnadSJ3-pQ_GpX3Hkf3mKjvb6uhYTdzA6VIz54pW6eOAuTlX9Eg5Wkn_9NYKiuDDSuZLIHRqNgTDzd7Wl_AmgelADW35VwA1TfrBbyD2xTR-frS1dRsuGuvTDI', text: '"As faltas caíram 40% no primeiro mês. Meus cabeleireiros adoram os lembretes automáticos."' },
                        { name: 'Carlos', role: 'Barbearia Cortes Clássicos', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGzjXQwSPQjgqMCF6-UrQrElXgNescgyEhioNLceJCpv9PtuB_ICC-BR53MxyG61XhbfCnfj3d3RwmmZc46Bb7xd_lpMqjNFIYV078laVi2jEKnoKkbLBn1_6PQzxZ8ubVzI8i7-EnAy0_Qg6Dy0I8Y6UdcGDQeUxE06LEl4RKW4nhfebUa-RRvCJh7mhhjo5laSQU3Jmkb4u_gfbXFKeG_OeLeF_SCfe-HDROuaFw9Iwo7oc3ADlQMTubQLHmhzpQtC1DpIJ7Oa4', text: '"Finalmente consigo controlar minhas finanças sem planilha. Esse app me economiza 5 horas por semana."' },
                        { name: 'Dra. Elena', role: 'Estética Pura', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGAKYCsQtSZvif9yvEgRsFE7T0Zvm6e3PXs1n9CXbbbV41aPu1q8uo176IfTanjrsTT9IwUgMdIc_nUbc9ZQabkfLLVHWf8J24o4hWOdJNXCSczAxbHsXLopyeBl-PjdUmB8M5_EukMFoakPGrwY-z0Rs4HPxD_VFoUbBD2q4N6CveZqTdX7Rw7vr3XxPeCYuZydPacC6t3kaae5D6q3rDtMnCMxmTDcbY3y01fsJKc8IVr9JoQuG3v4f9O_niqVnxwrmugshMpNQ', text: '"O link de agendamento online é revolucionário. Meus clientes agendam enquanto eu durmo."' }
                    ].map((t, i) => (
                        <div key={i} className="flex flex-col gap-4 bg-surface-light dark:bg-surface-dark p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-inner" style={{ backgroundImage: `url('${t.img}')` }}></div>
                                <div className="flex-1">
                                    <p className="text-slate-900 dark:text-white text-base font-bold">{t.name}</p>
                                    <p className="text-primary text-sm font-medium">{t.role}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-3xl opacity-20 rotate-180">format_quote</span>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-primary text-[20px] filled-icon">star</span>)}
                            </div>
                            <p className="text-slate-900 dark:text-white text-base leading-relaxed">{t.text}</p>
                        </div>
                    ))}
                </section>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pt-8">
                <button onClick={() => onNavigate(ScreenName.SIGNUP)} className="w-full max-w-md mx-auto flex items-center justify-center gap-2 rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg hover:bg-opacity-90 transition-all active:scale-[0.98]">
                    <span>Começar Teste Grátis</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default TestimonialsScreen;