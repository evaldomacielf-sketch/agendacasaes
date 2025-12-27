import React, { useState, useEffect } from 'react';
import { NavProps, ScreenName } from '../types';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import { useServices, Service } from '../hooks/useServices';
import { useProfessionals, Professional } from '../hooks/useProfessionals';
import { useAvailability } from '../hooks/useAvailability';
import LoadingSpinner from '../components/LoadingSpinner';

const BookingScreen: React.FC<NavProps> = ({ onNavigate }) => {
  // Navigation State
  const [currentStep, setCurrentStep] = useState(1);

  // Data Hooks
  const { services, loading: servicesLoading, error: servicesError } = useServices();
  const { professionals, loading: prosLoading } = useProfessionals();

  // Selection State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null); // null = "Any"
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Availability Hook
  const { slots, loading: slotsLoading } = useAvailability(selectedDate, selectedProfessional);

  // --- STEP 1 LOGIC ---
  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Geral')))];

  // --- HANDLERS ---
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const handleContinue = () => {
    if (currentStep === 1 && selectedServices.length > 0) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2 && selectedTime) {
      // Step 3 Logic (Coming soon)
      console.log(`Booking: ${selectedServices.length} services with ${selectedProfessional} at ${selectedTime}`);
      // alert(`Agendamento Confirmado! \nServiços: ${selectedServices.length}\nProfissional: ${selectedProfessional || 'Qualquer um'}\nData: ${selectedDate.toLocaleDateString()} às ${selectedTime}`);
      // onNavigate(ScreenName.CONFIRMATION);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      if (onNavigate) onNavigate(ScreenName.LANDING);
    }
  };

  // --- RENDERERS ---

  const renderStep1 = () => {
    const filteredServices = services.filter(service => activeCategory === 'Todos' || service.category === activeCategory);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-main dark:text-white leading-tight">Qual serviço você deseja?</h2>
          <p className="text-sm text-gray-500">Selecione um ou mais procedimentos.</p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sticky top-[110px] bg-background-light dark:bg-background-dark z-10 py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${activeCategory === cat ? 'bg-primary text-text-main shadow-md transform scale-105' : 'bg-surface-light border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 text-gray-600'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3 min-h-[300px]">
          {servicesLoading ? <div className="flex justify-center py-10"><LoadingSpinner /></div> :
            servicesError ? <div className="text-red-500 text-center">Erro ao carregar serviços.</div> :
              filteredServices.length === 0 ? <div className="text-gray-500 text-center py-10">Nenhum serviço encontrado.</div> :
                filteredServices.map(service => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div key={service.id} onClick={() => toggleService(service.id)} className={`group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm cursor-pointer transition-all border-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'} ring-1 ring-gray-100 dark:ring-gray-800`}>
                      <div className="flex justify-between items-start gap-4">
                        {service.image && <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200"><img src={service.image} className="w-full h-full object-cover" /></div>}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-bold text-text-main dark:text-white text-lg leading-tight">{service.name}</h3>
                            <div className={`shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-colors ml-2 ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                              {isSelected && <span className="material-symbols-outlined text-text-main text-sm font-bold">check</span>}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description || 'Sem descrição.'}</p>
                          {(service.rating || 0) > 0 && <div className="flex items-center mt-1 gap-1"><span className="text-yellow-500 material-symbols-outlined text-sm">star</span><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{service.rating}</span></div>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm text-gray-500"><span className="material-symbols-outlined text-[18px] mr-1">schedule</span>{service.duration_minutes} min</div>
                        <div className="font-bold text-text-main dark:text-white text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}</div>
                      </div>
                    </div>
                  );
                })}
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-main dark:text-white leading-tight">Escolha o profissional e horário</h2>
          <p className="text-sm text-gray-500">Selecione quem irá te atender e o melhor horário.</p>
        </div>

        {/* Professionals */}
        <div className="space-y-3">
          <h3 className="font-semibold text-text-main dark:text-white">Profissional</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedProfessional(null)}
              className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-28 ${selectedProfessional === null ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark'}`}
            >
              <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center"><span className="material-symbols-outlined text-primary text-2xl">groups</span></div>
              <div className="text-center"><p className="text-sm font-bold leading-tight">Qualquer um</p><p className="text-xs text-green-600 font-medium">Mais rápido</p></div>
            </button>

            {professionals.map(pro => (
              <button
                key={pro.id}
                onClick={() => setSelectedProfessional(pro.id)}
                className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-28 ${selectedProfessional === pro.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark'}`}
              >
                <div className="size-14 rounded-full bg-gray-200 overflow-hidden"><img src={pro.avatar_url || `https://ui-avatars.com/api/?name=${pro.full_name}&background=random`} className="w-full h-full object-cover" /></div>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight truncate w-full">{pro.full_name?.split(' ')[0] || 'Unknown'}</p>
                  <div className="flex items-center justify-center gap-0.5"><span className="text-yellow-500 material-symbols-outlined text-[10px]">star</span><span className="text-xs text-gray-500">{pro.rating}</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-main dark:text-white">Horários disponíveis</h3>
            <span className="text-sm text-primary font-medium">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}</span>
          </div>

          {slotsLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
            <div className="grid grid-cols-4 gap-3">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-2 px-1 rounded-lg text-sm font-semibold transition-all ${!slot.available
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed decoration-slice line-through'
                      : selectedTime === slot.time
                        ? 'bg-primary text-text-main shadow-lg ring-2 ring-primary ring-offset-2 dark:ring-offset-background-dark'
                        : 'bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary text-text-main dark:text-white'
                    }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Navbar
        onNavigate={onNavigate}
        variant="steps"
        step={{
          current: currentStep,
          total: 3,
          label: currentStep === 1 ? "Escolher Serviço" : "Profissional e Data",
          subLabel: `Passo ${currentStep} de 3`
        }}
      />

      <main className="w-full max-w-md mx-auto pt-[120px] px-4 pb-32">
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface-light border-t border-gray-100 dark:bg-background-dark dark:border-gray-800 p-4 pb-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md mx-auto flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 px-6 rounded-lg border border-gray-300 dark:border-gray-600 text-text-main dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleContinue}
            disabled={currentStep === 1 ? selectedServices.length === 0 : !selectedTime}
            className={`flex-[2] py-3.5 px-6 rounded-lg font-bold shadow-lg transition-all transform active:scale-[0.98] ${(currentStep === 1 ? selectedServices.length > 0 : selectedTime)
                ? 'bg-primary text-text-main hover:bg-primary-dark shadow-primary/30'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
              }`}
          >
            {currentStep === 2 ? 'Confirmar' : `Continuar (${(currentStep === 1 ? selectedServices.length : '')})`}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BookingScreen;