import React, { useState, useEffect } from 'react';
import { NavProps, ScreenName } from '../types';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import { useServices, Service } from '../hooks/useServices';
import LoadingSpinner from '../components/LoadingSpinner';

const BookingScreen: React.FC<NavProps> = ({ onNavigate }) => {
  const { services, loading, error } = useServices();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  // Extract unique categories from services
  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Geral')))];

  const filteredServices = services.filter(service =>
    activeCategory === 'Todos' || service.category === activeCategory
  );

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) return;
    // In a real app, populate a booking context here
    console.log("Selected services:", selectedServices);
    // onNavigate(ScreenName.BOOKING_CALENDAR); // Expected next step
    alert(`Selecionado ${selectedServices.length} serviços. Próximo passo: Calendário.`);
  };

  return (
    <Layout>
      <Navbar
        onNavigate={onNavigate}
        variant="steps"
        step={{
          current: 1, // Step 1: Service Selection
          total: 3,   // 3-Click Flow: Service -> Time -> Confirm
          label: "Escolher Serviço",
          subLabel: "Passo 1 de 3"
        }}
      />

      <main className="w-full max-w-md mx-auto pt-[120px] px-4 space-y-6 pb-32">

        {/* Header Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-main dark:text-white leading-tight">Qual serviço você deseja?</h2>
          <p className="text-sm text-gray-500">Selecione um ou mais procedimetos.</p>
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sticky top-[110px] bg-background-light dark:bg-background-dark z-10 py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${activeCategory === cat
                ? 'bg-primary text-text-main shadow-md transform scale-105'
                : 'bg-surface-light border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="space-y-3 min-h-[300px]">
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">Erro ao carregar serviços. Tente novamente.</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-gray-500 text-center py-10">Nenhum serviço encontrado nesta categoria.</div>
          ) : (
            filteredServices.map(service => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm cursor-pointer transition-all border-2 ${isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent hover:border-primary/30'
                    } ring-1 ring-gray-100 dark:ring-gray-800`}
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Image (Optional) */}
                    {service.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-text-main dark:text-white text-lg leading-tight">{service.name}</h3>
                        <div className={`shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-colors ml-2 ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                          {isSelected && <span className="material-symbols-outlined text-text-main text-sm font-bold">check</span>}
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description || 'Sem descrição.'}</p>

                      {/* Rating */}
                      {(service.rating || 0) > 0 && (
                        <div className="flex items-center mt-1 gap-1">
                          <span className="text-yellow-500 material-symbols-outlined text-sm">star</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{service.rating}</span>
                          <span className="text-xs text-slate-400">({service.review_count})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Duration & Price */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="material-symbols-outlined text-[18px] mr-1">schedule</span>
                      {service.duration_minutes} min
                    </div>
                    <div className="font-bold text-text-main dark:text-white text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-light border-t border-gray-100 dark:bg-background-dark dark:border-gray-800 p-4 pb-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md mx-auto flex gap-3">
          <button
            onClick={() => onNavigate && onNavigate(ScreenName.LANDING)}
            className="flex-1 py-3.5 px-6 rounded-lg border border-gray-300 dark:border-gray-600 text-text-main dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleContinue}
            disabled={selectedServices.length === 0}
            className={`flex-[2] py-3.5 px-6 rounded-lg font-bold shadow-lg transition-all transform active:scale-[0.98] ${selectedServices.length > 0
              ? 'bg-primary text-text-main hover:bg-primary-dark shadow-primary/30'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
              }`}
          >
            Continuar ({selectedServices.length})
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BookingScreen;