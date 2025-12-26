import React, { useState } from 'react';
import { NavProps, ScreenName } from '../types';

const PricingScreen: React.FC<NavProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
      <div className="sticky top-0 z-50 flex items-center bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => onNavigate(ScreenName.LANDING)} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold flex-1 text-center">Planos e Preços</h2>
        <span className="material-symbols-outlined text-primary cursor-pointer text-[24px]">help</span>
      </div>

      <main className="flex-1 flex flex-col items-center w-full pb-8">
        <div className="w-full px-6 pt-6 pb-2 text-center">
          <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold mb-2">Escolha o plano ideal</h1>
          <p className="text-slate-600 dark:text-gray-400 text-base">Transforme a gestão do seu salão hoje.<br />Cancele quando quiser.</p>
        </div>

        {/* Toggle */}
        <div className="w-full px-6 py-4">
          <div className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800 p-1">
            <button
              onClick={() => setPeriod('monthly')}
              className={`flex-1 h-full rounded-lg font-semibold text-sm transition-all ${period === 'monthly' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-500'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`flex-1 h-full rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${period === 'yearly' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-500'}`}
            >
              Anual <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col w-full gap-4 px-4 mt-2">
          {/* Plan 1 */}
          <div className="group flex flex-col gap-5 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-[1.01] transition-transform">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Essencial</h3>
              <p className="text-sm text-slate-500">Ideal para autônomos</p>
            </div>
            <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
              <span className="text-3xl font-black">R$ 49,90</span>
              <span className="text-sm font-medium text-slate-500">/mês</span>
            </div>
            <button className="w-full rounded-xl h-11 border border-primary text-primary font-bold text-sm hover:bg-primary/5">Assinar Essencial</button>
            <div className="space-y-3 pt-2">
              {['1-2 Profissionais', 'Agenda Online 24h', 'Cadastro de Clientes', 'Relatórios Básicos'].map((feat, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-gray-300">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan 2 Recommended */}
          <div className="relative flex flex-col gap-5 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 ring-2 ring-primary shadow-lg scale-[1.02] z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Recomendado</div>
            <div className="mt-1">
              <h3 className="text-xl font-bold text-primary">Profissional</h3>
              <p className="text-sm text-slate-500">Para salões em crescimento</p>
            </div>
            <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
              <span className="text-4xl font-black">R$ 89,90</span>
              <span className="text-sm font-medium text-slate-500">/mês</span>
            </div>
            <button className="w-full rounded-xl h-12 bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md">Assinar Profissional</button>
            <div className="space-y-3 pt-2">
              {['Até 5 Profissionais', 'Financeiro Avançado', 'Cálculo de Comissões', 'Controle de Estoque', 'Campanhas WhatsApp'].map((feat, i) => (
                <div key={i} className="flex items-start gap-3 text-sm font-medium text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary text-[20px] filled-icon">check_circle</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-primary font-bold mt-1">Teste grátis por 7 dias</p>
          </div>

          {/* Plan 3 */}
          <div className="group flex flex-col gap-5 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-[1.01] transition-transform">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Premium</h3>
              <p className="text-sm text-slate-500">Gestão completa e ilimitada</p>
            </div>
            <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
              <span className="text-3xl font-black">R$ 149,90</span>
              <span className="text-sm font-medium text-slate-500">/mês</span>
            </div>
            <button className="w-full rounded-xl h-11 border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5">Assinar Premium</button>
            <div className="space-y-3 pt-2">
              {['Profissionais Ilimitados', 'Múltiplas Unidades', 'Suporte Prioritário VIP', 'API de Integração', 'White-label'].map((feat, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-gray-300">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 px-6 pb-6 text-center">
          <p className="text-sm text-slate-500 mb-4">Ainda tem dúvidas sobre qual plano escolher?</p>
          <button className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold text-sm">
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            Falar com um consultor
          </button>
        </div>
      </main>
    </div>
  );
};

export default PricingScreen;