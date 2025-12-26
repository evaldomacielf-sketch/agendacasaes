import React from 'react';
import { NavProps, ScreenName } from '../../types';

import Layout from '../components/Layout';
import Navbar from '../components/Navbar';

const FeaturesScreen: React.FC<NavProps> = ({ onNavigate }) => {
  return (
    <Layout>
      <Navbar onNavigate={onNavigate} variant="back" title="Funcionalidades" />

      <div className="flex flex-col w-full">
        <h2 className="text-text-main dark:text-white text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-6">
          Gerencie seu negócio com inteligência
        </h2>
        <p className="text-text-secondary dark:text-gray-400 text-center px-4 text-sm pb-6">
          Tudo o que você precisa para crescer e organizar sua agenda em um só lugar.
        </p>

        {/* Finance Section */}
        <div className="flex flex-col gap-6 px-4 py-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-primary">currency_exchange</span>
              </div>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">Financeiro</span>
            </div>
            <h1 className="text-text-main dark:text-white text-2xl font-bold leading-tight">Comissões automáticas</h1>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
              Defina regras por profissional ou serviço. O cálculo é automático e o repasse é garantido para contas digitais.
            </p>
            <button className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit group">
              <span>Saiba mais sobre financeiro</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#1a2c24] p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Simulação de Repasse</span>
              <span className="material-symbols-outlined text-gray-400 text-sm">pie_chart</span>
            </div>
            <div className="flex items-stretch justify-between gap-4">
              <div className="flex flex-col justify-center gap-1 flex-[2]">
                <p className="text-text-main dark:text-white text-base font-bold">Corte + Barba</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">Split Auto</span>
                </div>
                <p className="text-text-secondary dark:text-gray-300 text-sm mt-2">
                  Total: <span className="font-semibold text-text-main dark:text-white">R$ 100,00</span>
                </p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  <span>Pro: <b>R$ 70</b></span>
                  <span className="text-gray-300">|</span>
                  <span>Salão: <b>R$ 30</b></span>
                </div>
              </div>
              <div
                className="w-24 bg-center bg-no-repeat bg-cover rounded-lg flex-none bg-gray-100 relative overflow-hidden"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAAZeaXV1IDsMZR7tkbXVo6VivRa59cD2wA90v6JhnARvJg2GVlvrPFNDOe7TRANeb5iZUGw8TJ80TuYrp4U-MtZXt5D1dgO5gw5grGDCkATxRFibY52LVh2vP97yKsA_e5r_JwXUHv1b1VjlsFCR3Ki_u2TM7ILZ2YRnNIQ15u-Lsj8I0iHW4MCe3U8t-FizjBvXSVV2bUJjmov_uG_t38LARMyONTXYJGS1UtfbkCpRYAA6grK1CidmeDYV24X3j_G8GCZcGEwQA")' }}
              >
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: 'tune', title: 'Regras flexíveis', subtitle: 'Configure % por serviço' },
              { icon: 'call_split', title: 'Split Auto', subtitle: 'Divisão automática' },
              { icon: 'receipt_long', title: 'Histórico', subtitle: 'Relatórios de repasses' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2c24] p-3 hover:border-primary/50 transition-colors">
                <div className="text-primary bg-primary/10 w-fit p-2 rounded-lg">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <h3 className="text-text-main dark:text-white text-xs font-bold">{item.title}</h3>
                  <p className="text-text-secondary dark:text-gray-400 text-[10px] leading-tight mt-1">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Section */}
        <div className="flex flex-col gap-6 px-4 py-8 bg-white/50 dark:bg-black/20">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-primary">campaign</span>
              </div>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">Crescimento</span>
            </div>
            <h1 className="text-text-main dark:text-white text-2xl font-bold leading-tight">Marketing e relacionamento</h1>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
              Lembretes automáticos via WhatsApp e SMS para reduzir faltas. Crie campanhas de fidelidade para encantar.
            </p>
          </div>

          <div className="rounded-xl bg-background-light dark:bg-[#12201a] p-4 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-6xl text-primary">mark_chat_unread</span>
            </div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase">Preview de Lembrete</span>
              <span className="material-symbols-outlined text-primary text-sm">notifications_active</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">chat</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-white dark:bg-[#1a2c24] p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700 max-w-[280px]">
                  <p className="text-text-main dark:text-white text-sm leading-snug">
                    <span className="font-bold">AgendaCasa:</span> Oi Ana! 👋 Seu horário de <span className="text-primary font-semibold">Manicure</span> é amanhã às 14:00.
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 ml-1">Enviado automaticamente • 18:30</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-6 pb-12 bg-white dark:bg-[#12201a] mt-auto border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4 text-center">
          <h3 className="text-text-main dark:text-white text-lg font-bold">Pronto para transformar seu negócio?</h3>
          <button onClick={() => onNavigate(ScreenName.SIGNUP)} className="w-full max-w-sm rounded-xl h-12 bg-primary hover:bg-green-600 transition-colors text-white font-bold shadow-lg shadow-green-500/20">
            Começar teste grátis
          </button>
          <p className="text-xs text-text-secondary dark:text-gray-400">Não requer cartão de crédito • Cancele a qualquer momento</p>
        </div>
      </div>
    </Layout>
  );
};

export default FeaturesScreen;