import React, { useState, useEffect } from 'react';
import { NavProps, ScreenName } from '../types';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import { useServices, Service } from '../hooks/useServices';
import { useProfessionals } from '../hooks/useProfessionals';
import { useAvailability } from '../hooks/useAvailability';
import LoadingSpinner from '../components/LoadingSpinner';
import { PhoneInput } from '../components/PhoneInput';
import { supabase } from '../utils/supabaseClient';
import { ServiceCard } from '../components/Booking/ServiceCard';
import { DateHorizontalPicker } from '../components/Booking/DateHorizontalPicker';
import { BookingSummary } from '../components/Booking/BookingSummary';

// Custom Stepper Component for this Page
const BookingStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { num: 1, label: 'Serviço' },
    { num: 2, label: 'Data & Horário' },
    { num: 3, label: 'Seus Dados' }
  ];

  /* eslint-disable-next-line react-dom/no-unsafe-inline-style */
  const activeLineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.style.width = `calc(${((currentStep - 1) / 2) * 100}% - 32px)`;
    }
  }, [currentStep]);

  return (
    <div className="w-full bg-surface-light dark:bg-background-dark pt-6 pb-2 px-4">
      <div className="max-w-md mx-auto relative px-4">
        {/* Line Background */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
        {/* Active Line */}
        <div
          ref={activeLineRef}
          className="absolute top-4 left-4 h-0.5 bg-primary -z-10 transition-all duration-300"
        />

        <div className="flex justify-between w-full">
          {steps.map((s) => {
            const isActive = s.num === currentStep;
            const isCompleted = s.num < currentStep;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-surface-light dark:bg-background-dark px-2">
                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${isActive || isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600'}
                 `}>
                  {isCompleted ? <span className="material-symbols-outlined text-[18px]">check</span> : s.num}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const BookingScreen: React.FC<NavProps> = ({ onNavigate }) => {
  // Navigation State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Tenant State
  // For MVP, we'll try to find a public tenant, e.g. "AgendaCasaES" or the first one found.
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantLoaded, setTenantLoaded] = useState(false);

  useEffect(() => {
    // Find default tenant for the public booking page
    const loadDefaultTenant = async () => {
      try {
        // Try to get first available tenant from saloes or tenants table
        let data = null;

        // Try saloes table first
        const { data: saloesData } = await supabase.from('saloes').select('id').limit(1).single();
        if (saloesData) {
          data = saloesData;
        } else {
          // Fallback to tenants table if saloes doesn't exist
          const { data: tenantsData } = await supabase.from('tenants').select('id').limit(1).single();
          if (tenantsData) data = tenantsData;
        }

        if (data) {
          setTenantId(data.id);
        }
      } catch (err) {
        console.warn('Could not load tenant, using public mode:', err);
      } finally {
        setTenantLoaded(true);
      }
    };
    loadDefaultTenant();
  }, []);

  // Data Hooks - now useServices fetches even without tenantId
  const { services, loading: servicesLoading, error: servicesError } = useServices(tenantId || undefined);
  const { professionals } = useProfessionals();

  // Selection State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null); // null = "Any"
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Client Data State (Step 3)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Availability Hook
  const { slots, loading: slotsLoading } = useAvailability(selectedDate, selectedProfessional, tenantId || undefined);

  // Computed
  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Geral')))];

  const totalValue = services
    .filter(s => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + curr.price, 0);

  // Handlers
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const handleContinue = () => {
    if (currentStep === 1 && selectedServices.length > 0) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2 && selectedTime) {
      setCurrentStep(3);
      window.scrollTo(0, 0);
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      if (onNavigate) onNavigate(ScreenName.LANDING);
    }
  };

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      alert("Por favor, aceite os termos e política de cancelamento.");
      return;
    }
    if (!tenantId) {
      alert("Erro: Estabelecimento não identificado.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Upsert Client
      let clientId: string | null = null;
      // Check by Phone for simple dedup
      const { data: existingClient } = await supabase.from('clients').select('id').eq('tenant_id', tenantId).eq('phone', clientPhone).maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({
          tenant_id: tenantId, full_name: clientName, phone: clientPhone, email: clientEmail || null, notes: clientNotes
        }).select('id').single();
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // 3. Insert Appointments
      let currentStartTime = new Date(selectedDate);
      const [h, m] = (selectedTime || '00:00').split(':').map(Number);
      currentStartTime.setHours(h, m, 0, 0);

      const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id));

      let primaryApptId = null;

      for (const service of selectedServiceObjects) {
        const endTime = new Date(currentStartTime);
        endTime.setMinutes(endTime.getMinutes() + service.duration_minutes);

        const { data: appt, error: apptError } = await supabase.from('appointments').insert({
          tenant_id: tenantId,
          client_id: clientId,
          service_id: service.id,
          staff_id: selectedProfessional,
          start_time: currentStartTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          notes: clientNotes
        }).select('id').single();

        if (apptError) throw apptError;
        if (!primaryApptId) primaryApptId = appt.id;

        // Shift start time for next service (sequential)
        currentStartTime = endTime;
      }

      // 4. Notify
      try {
        supabase.functions.invoke('agent-notifications', { body: { type: 'confirmation', client_name: clientName } });
      } catch (e) { console.warn("Notification error", e) }

      setBookingId(primaryApptId || 'UNKNOWN');
      setIsSuccess(true);
      window.scrollTo(0, 0);

    } catch (err: any) {
      console.error("Booking Error:", err);
      // Fallback for Demo
      if (err.message && err.message.includes('fetch')) {
        alert("Modo Offline: Agendamento simulado com sucesso!");
        setIsSuccess(true);
      } else {
        alert(`Erro: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- Render Steps ---

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-in fade-in zoom-in duration-500">
      <div className="size-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
        <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">Agendamento Confirmado!</h2>
      <p className="text-gray-500 text-center max-w-xs mb-8">
        Obrigado, {clientName.split(' ')[0]}. Enviamos os detalhes para seu WhatsApp.
      </p>

      <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Reserva ID</p>
            <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">#{bookingId?.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="size-12 bg-white p-1 rounded-lg border border-gray-200">
            {/* Placeholder QR */}
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}`} alt="QR Code" className="w-full h-full opacity-80" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-400">calendar_month</span>
            <p className="text-slate-700 dark:text-gray-200 font-medium">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-400">schedule</span>
            <p className="text-slate-700 dark:text-gray-200 font-medium">
              {selectedTime}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-gray-400">spa</span>
            <p className="text-slate-700 dark:text-gray-200 font-medium truncate">
              {services.find(s => s.id === selectedServices[0])?.name}
              {selectedServices.length > 1 && ` + ${selectedServices.length - 1}`}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">Apresente este código na recepção.</p>
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-10 text-primary font-bold hover:underline"
      >
        Fazer novo agendamento
      </button>
    </div>
  );

  if (isSuccess) {
    return (
      <Layout>
        <Navbar variant="back" title="Reserva Confirmada" onNavigate={onNavigate} />
        <main className="w-full max-w-md mx-auto pt-16 px-4">
          {renderSuccess()}
        </main>
      </Layout>
    )
  }

  const renderStep1 = () => {
    const filteredServices = services.filter(service => activeCategory === 'Todos' || service.category === activeCategory);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Qual serviço você deseja?</h2>
          <p className="text-sm text-gray-500">Selecione um ou mais procedimentos.</p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full font-medium text-sm transition-all whitespace-nowrap 
                        ${activeCategory === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-surface-dark dark:border-gray-700 dark:text-gray-300'}
                    `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3 min-h-[300px] pb-20">
          {servicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : servicesError ? (
            <div className="text-center py-10">
              <p className="text-red-500 mb-2">Não foi possível carregar os serviços.</p>
              <button onClick={() => window.location.reload()} className="text-primary font-bold underline">Tentar novamente</button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Nenhum serviço encontrado nesta categoria.</div>
          ) : (
            filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServices.includes(service.id)}
                onToggle={toggleService}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    // Group slots
    const morningSlots = slots.filter(s => parseInt(s.time.split(':')[0]) < 12);
    const afternoonSlots = slots.filter(s => { const h = parseInt(s.time.split(':')[0]); return h >= 12 && h < 18; });
    const eveningSlots = slots.filter(s => parseInt(s.time.split(':')[0]) >= 18);

    const renderSlotGroup = (title: string, groupSlots: typeof slots) => {
      if (groupSlots.length === 0) return null;
      return (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
          <div className="grid grid-cols-4 gap-2">
            {groupSlots.map(slot => (
              <button
                key={slot.time}
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.time)}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${!slot.available
                  ? 'bg-gray-50 text-gray-300 dark:bg-gray-800/50 dark:text-gray-700 cursor-not-allowed line-through'
                  : selectedTime === slot.time
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-white border border-gray-200 dark:bg-surface-dark dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:border-primary'
                  }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quando você quer ir?</h2>
          <p className="text-sm text-gray-500">Escolha o dia e o horário.</p>
        </div>

        <DateHorizontalPicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        <div className="mt-6">
          <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">Horários</h3>
          {slotsLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              {renderSlotGroup('Manhã', morningSlots)}
              {renderSlotGroup('Tarde', afternoonSlots)}
              {renderSlotGroup('Noite', eveningSlots)}
            </>
          )}
        </div>

        {/* Professional Choice (Simplified) */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">Profissional (Opcional)</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setSelectedProfessional(null)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark ${selectedProfessional === null ? 'ring-2 ring-primary border-transparent' : ''}`}
            >
              <span className="material-symbols-outlined text-gray-500">groups</span>
              <span className="text-sm font-medium">Qualquer um</span>
            </button>
            {professionals.map(pro => (
              <button
                key={pro.id}
                onClick={() => setSelectedProfessional(pro.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark ${selectedProfessional === pro.id ? 'ring-2 ring-primary border-transparent' : ''}`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                  <img src={pro.avatar_url || `https://ui-avatars.com/api/?name=${pro.full_name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{pro.full_name?.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
      <BookingSummary
        selectedServices={selectedServices}
        services={services}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        totalValue={totalValue}
      />

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Seus Dados</h3>
        <div className="space-y-3">
          <input
            type="text" placeholder="Nome Completo *"
            value={clientName} onChange={e => setClientName(e.target.value)}
            className="w-full rounded-xl border-gray-200 bg-white p-3 text-sm focus:ring-primary focus:border-primary dark:bg-surface-dark dark:border-gray-700"
          />
          <PhoneInput value={clientPhone} onChange={setClientPhone} />
          <input
            type="email" placeholder="E-mail (opcional)"
            value={clientEmail} onChange={e => setClientEmail(e.target.value)}
            className="w-full rounded-xl border-gray-200 bg-white p-3 text-sm focus:ring-primary focus:border-primary dark:bg-surface-dark dark:border-gray-700"
          />
          <textarea
            placeholder="Observações (alergias, preferências...)"
            value={clientNotes} onChange={e => setClientNotes(e.target.value)}
            className="w-full rounded-xl border-gray-200 bg-white p-3 text-sm focus:ring-primary focus:border-primary dark:bg-surface-dark dark:border-gray-700 min-h-[80px]"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-xs text-gray-500">Li e aceito os <span className="underline">termos de uso</span> e a <span className="underline">política de cancelamento</span> (cancelamento gratuito até 24h antes).</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifySms} onChange={e => setNotifySms(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-xs text-gray-500">Receber lembretes via WhatsApp/SMS</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Navbar Title Only */}
      <Navbar variant="back" title="Agendamento" onNavigate={onNavigate} />

      {/* Custom Stepper */}
      <div className="pt-16 bg-surface-light dark:bg-background-dark">
        <BookingStepper currentStep={currentStep} />
      </div>

      <main className="w-full max-w-md mx-auto pt-6 px-4 pb-32">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 p-4 pb-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3.5 px-6 rounded-xl border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-white font-semibold hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          )}

          <button
            onClick={handleContinue}
            disabled={
              isSubmitting ||
              (currentStep === 1 && selectedServices.length === 0) ||
              (currentStep === 2 && !selectedTime) ||
              (currentStep === 3 && (clientName.length < 3 || clientPhone.length < 10 || !acceptedTerms))
            }
            className={`flex-[2] py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                    ${(currentStep === 1 && selectedServices.length > 0) || (currentStep === 2 && selectedTime) || (currentStep === 3 && clientName.length >= 3 && clientPhone.length >= 10 && acceptedTerms)
                ? 'bg-primary hover:bg-primary-dark shadow-primary/25'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
              }
                `}
          >
            {isSubmitting ? <LoadingSpinner /> : (
              currentStep === 3 ? 'Confirmar Agendamento' : 'Continuar'
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BookingScreen;