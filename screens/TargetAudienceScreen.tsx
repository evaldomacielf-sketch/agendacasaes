import React from 'react';
import { NavProps, ScreenName } from '../../types';

const TargetAudienceScreen: React.FC<NavProps> = ({ onNavigate }) => {
  const cards = [
    {
      title: 'Salão de Beleza',
      icon: 'content_cut',
      benefits: ['Agenda cheia e organizada', 'Histórico detalhado de clientes', 'Gestão de pacotes e comissões']
    },
    {
      title: 'Barbearia',
      icon: 'face',
      benefits: ['Agendamento rápido e fácil', 'App exclusivo para profissionais', 'Gestão de clube de assinaturas']
    },
    {
      title: 'Estética & Spa',
      icon: 'spa',
      benefits: ['Controle de sessões e pacotes', 'Ficha de anamnese digital', 'Lembretes automáticos']
    },
    {
      title: 'Esmalteria & Unhas',
      icon: 'brush',
      benefits: ['Gestão de horários recorrentes', 'Controle de estoque de materiais', 'Calculo de comissão automático']
    },
    {
      title: 'Massagem e bem-estar',
      icon: 'self_improvement',
      benefits: ['Agenda flexível por profissional', 'Lembretes via WhatsApp', 'Histórico de tratamentos']
    }
  ];

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
      <header className="sticky top-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => onNavigate(ScreenName.LANDING)} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-start">
          <span className="material-symbols-outlined text-[28px]">menu</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold flex-1 text-center">AgendaCasaES</h2>
        <button onClick={() => onNavigate(ScreenName.LOGIN)} className="text-primary font-bold">Entrar</button>
      </header>

      <div className="flex flex-col px-6 pt-8 pb-4">
        <h1 className="text-slate-900 dark:text-white text-[32px] font-extrabold leading-[1.15] text-center mb-3">
          Para quem é a <span className="text-primary">AgendaCasaES</span>
        </h1>
        <p className="text-slate-600 dark:text-gray-300 text-base text-center max-w-[320px] mx-auto">
          A plataforma completa para gerenciar o seu negócio de beleza e estética com simplicidade.
        </p>
      </div>

      <main className="flex-1 flex flex-col gap-5 px-5 pb-24 pt-2">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="size-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
              </div>
              <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors">arrow_forward</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors">{card.title}</h3>
            <ul className="space-y-2 mb-5">
              {card.benefits.map((benefit, bIdx) => (
                <li key={bIdx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  {benefit}
                </li>
              ))}
            </ul>
            <button className="w-full h-11 rounded-xl bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white font-semibold text-sm hover:bg-primary hover:text-white transition-all border border-gray-200 dark:border-white/10 group-hover:border-primary">
              Ver como funciona
            </button>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 max-w-md mx-auto z-40">
        <button onClick={() => onNavigate(ScreenName.SIGNUP)} className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-base font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all">
          Começar agora
          <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
        </button>
      </div>
    </div>
  );
};

export default TargetAudienceScreen;