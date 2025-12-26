import React from 'react';
import { NavProps, ScreenName } from '../../types';

import Layout from '../components/Layout';
import Navbar from '../components/Navbar';

const LandingScreen: React.FC<NavProps> = ({ onNavigate }) => {
  return (
    <Layout>
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-[20%] left-[-50px] w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>

      <Navbar onNavigate={onNavigate} variant="landing" />

      <main className="w-full">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Gestão simplificada
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Sistema completo para salões, barbearias e estética <span className="text-primary block sm:inline">em um só lugar</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Tenha controle total com agenda online, financeiro, estoque e redução de faltas. Tudo o que você precisa para crescer o seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
              <button onClick={() => onNavigate(ScreenName.SIGNUP)} className="w-full sm:w-auto px-8 h-14 bg-primary hover:bg-primary-dark text-white text-base font-bold rounded-lg shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 duration-200 flex items-center justify-center gap-2">
                <span>Começar teste gratuito</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button onClick={() => onNavigate(ScreenName.PRICING)} className="w-full sm:w-auto px-8 h-14 bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-base font-semibold rounded-lg transition-colors flex items-center justify-center">
                Ver planos e preços
              </button>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 pt-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Teste grátis de 7 dias, sem cartão de crédito.
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-16 w-full max-w-4xl mx-auto perspective-1000">
            <div className="relative bg-white dark:bg-[#1a2c24] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-black/50 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
              {/* App Window Header */}
              <div className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-[#1a2c24]">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="hidden sm:block h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
                  <div className="hidden sm:flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined mr-2 text-[20px]">grid_view</span>
                    Dashboard
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden xs:flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/20 bg-[url('https://api.dicebear.com/9.x/avataaars/svg?seed=Felix')] bg-cover"></div>
                </div>
              </div>

              {/* Dashboard Internal Content */}
              <div className="flex flex-col md:flex-row min-h-[400px]">
                {/* Sidebar */}
                <div className="hidden md:flex w-16 lg:w-64 flex-col border-r border-gray-100 dark:border-gray-800 p-4 gap-4 bg-gray-50/50 dark:bg-black/20">
                  <div className="h-10 w-full bg-primary/10 rounded-lg flex items-center px-3 gap-3 text-primary font-medium cursor-pointer">
                    <span className="material-symbols-outlined">home</span>
                    <span className="hidden lg:inline">Início</span>
                  </div>
                  <div className="h-10 w-full hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center px-3 gap-3 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer" onClick={() => onNavigate(ScreenName.BOOKING)}>
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="hidden lg:inline">Agenda</span>
                  </div>
                  <div className="h-10 w-full hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center px-3 gap-3 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer" onClick={() => onNavigate(ScreenName.MAIN_FEATURES)}>
                    <span className="material-symbols-outlined">attach_money</span>
                    <span className="hidden lg:inline">Financeiro</span>
                  </div>
                </div>

                {/* Main Area */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50/30 dark:bg-transparent">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Visão Geral</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Bem-vindo de volta, Studio Glamour</p>
                      </div>
                      <button onClick={() => onNavigate(ScreenName.BOOKING)} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm self-start sm:self-auto hover:bg-primary-dark transition-colors">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Novo Agendamento
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                      {/* Revenue Card */}
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Receita do mês</p>
                            <h4 className="text-2xl font-bold text-slate-800 dark:text-white">R$ 12.450</h4>
                          </div>
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-primary">
                            <span className="material-symbols-outlined text-[20px]">trending_up</span>
                          </div>
                        </div>
                        <div className="w-full h-12 flex items-end gap-1">
                          <div className="w-1/6 bg-primary/20 h-[40%] rounded-sm"></div>
                          <div className="w-1/6 bg-primary/30 h-[60%] rounded-sm"></div>
                          <div className="w-1/6 bg-primary/20 h-[50%] rounded-sm"></div>
                          <div className="w-1/6 bg-primary/40 h-[70%] rounded-sm"></div>
                          <div className="w-1/6 bg-primary/20 h-[55%] rounded-sm"></div>
                          <div className="w-1/6 bg-primary h-[85%] rounded-sm animate-pulse"></div>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">+15% vs mês anterior</p>
                      </div>

                      {/* Appointments Card */}
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm sm:col-span-1 lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-bold text-slate-800 dark:text-white">Próximos Hoje</h4>
                          <span className="text-xs text-primary font-medium cursor-pointer">Ver todos</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className="flex flex-col items-center justify-center h-10 w-12 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                              <span className="text-xs font-bold">14:00</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Corte Masculino</p>
                              <p className="text-xs text-slate-500 truncate">Carlos Eduardo • Barba e Cabelo</p>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          </div>
                          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className="flex flex-col items-center justify-center h-10 w-12 bg-purple-50 dark:bg-purple-900/20 rounded text-purple-600 dark:text-purple-400">
                              <span className="text-xs font-bold">15:30</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Hidratação Profunda</p>
                              <p className="text-xs text-slate-500 truncate">Ana Clara • Cabelo</p>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default LandingScreen;