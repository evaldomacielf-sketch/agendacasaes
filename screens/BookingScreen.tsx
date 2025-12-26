import React, { useState } from 'react';
import { NavProps, ScreenName } from '../types';

import Layout from '../components/Layout';
import Navbar from '../components/Navbar';

const BookingScreen: React.FC<NavProps> = ({ onNavigate }) => {
  const [selectedService, setSelectedService] = useState('corte-degrade');

  return (
    <Layout>
      <Navbar
        onNavigate={onNavigate}
        variant="steps"
        step={{
          current: 2,
          total: 5,
          label: "Escolher Serviço",
          subLabel: "Passo"
        }}
      />

      <main className="w-full max-w-md mx-auto pt-[160px] px-4 space-y-8 pb-32">
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text-main dark:text-white leading-tight">Qual serviço você deseja?</h2>
            <p className="text-sm text-gray-500">Selecione um ou mais serviços para o seu agendamento.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            <button className="shrink-0 px-4 py-2 rounded-full bg-primary text-text-main font-medium text-sm shadow-sm">Todos</button>
            {['Cabelo', 'Barba', 'Hidratação', 'Estética'].map(cat => (
              <button key={cat} className="shrink-0 px-4 py-2 rounded-full bg-surface-light border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{cat}</button>
            ))}
          </div>

          <div className="space-y-3">
            <label
              onClick={() => setSelectedService('corte-degrade')}
              className={`group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm cursor-pointer transition-all ${selectedService === 'corte-degrade' ? 'border-2 border-primary' : 'border border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-text-main dark:text-white text-lg">Corte Degradê</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">Corte moderno com acabamento na navalha e finalização com pomada.</p>
                </div>
                <div className="shrink-0 relative">
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedService === 'corte-degrade' ? 'border-primary bg-primary' : 'border-gray-300 bg-transparent'}`}>
                    {selectedService === 'corte-degrade' && <span className="material-symbols-outlined text-text-main text-sm font-bold">check</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="material-symbols-outlined text-[18px] mr-1">schedule</span>
                  45 min
                </div>
                <div className="font-bold text-text-main dark:text-white text-lg">R$ 45,00</div>
              </div>
            </label>

            <label
              onClick={() => setSelectedService('barba-completa')}
              className={`group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm cursor-pointer transition-all ${selectedService === 'barba-completa' ? 'border-2 border-primary' : 'border border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-text-main dark:text-white text-lg">Barba Completa</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">Barba terapia com toalha quente e massagem facial.</p>
                </div>
                <div className="shrink-0 relative">
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedService === 'barba-completa' ? 'border-primary bg-primary' : 'border-gray-300 bg-transparent'}`}>
                    {selectedService === 'barba-completa' && <span className="material-symbols-outlined text-text-main text-sm font-bold">check</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="material-symbols-outlined text-[18px] mr-1">schedule</span>
                  30 min
                </div>
                <div className="font-bold text-text-main dark:text-white text-lg">R$ 35,00</div>
              </div>
            </label>

            <label
              onClick={() => setSelectedService('sobrancelha')}
              className={`group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm cursor-pointer transition-all ${selectedService === 'sobrancelha' ? 'border-2 border-primary' : 'border border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-text-main dark:text-white text-lg">Sobrancelha</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">Design de sobrancelha na pinça ou navalha.</p>
                </div>
                <div className="shrink-0 relative">
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedService === 'sobrancelha' ? 'border-primary bg-primary' : 'border-gray-300 bg-transparent'}`}>
                    {selectedService === 'sobrancelha' && <span className="material-symbols-outlined text-text-main text-sm font-bold">check</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="material-symbols-outlined text-[18px] mr-1">schedule</span>
                  15 min
                </div>
                <div className="font-bold text-text-main dark:text-white text-lg">R$ 20,00</div>
              </div>
            </label>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface-light border-t border-gray-100 dark:bg-background-dark dark:border-gray-800 p-4 pb-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md mx-auto flex gap-3">
          <button className="flex-1 py-3.5 px-6 rounded-lg border border-gray-300 dark:border-gray-600 text-text-main dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Voltar</button>
          <button onClick={() => alert("Flow continues...")} className="flex-[2] py-3.5 px-6 rounded-lg bg-primary text-text-main font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark hover:text-white transition-all transform active:scale-[0.98]">Continuar</button>
        </div>
      </div>
    </Layout>
  );
};

export default BookingScreen;