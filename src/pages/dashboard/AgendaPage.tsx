import React, { useState, useEffect } from 'react';
import { NavProps, ScreenName } from '../../types';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAppointments, Appointment } from '../../hooks/useAppointments';
import OnboardingTrial from '../../components/dashboard/OnboardingTrial';
import AITipCard from '../../components/dashboard/AITipCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useAI } from '../../hooks/useAI';
import { useServices } from '../../hooks/useServices';
import { useClients } from '../../hooks/useClients';
import { useStaff } from '../../hooks/useStaff';

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

const AgendaScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user } = useAuth();
    const { tenantId } = useTenant();
    const { proactiveTip, setProactiveTip, searchServices } = useAI();
    const { services } = useServices(tenantId ?? undefined);

    // Pass tenantId to hooks
    const { appointments, loading, error, createAppointment } = useAppointments(selectedDate, tenantId);
    const { clients } = useClients(tenantId);
    const { staff } = useStaff(tenantId);

    // New Appointment Modal State
    const [showNewApptModal, setShowNewApptModal] = useState(false);
    const [newApptForm, setNewApptForm] = useState({ clientId: '', serviceId: '', staffId: '', time: '09:00', notes: '' });
    const [isCreatingAppt, setIsCreatingAppt] = useState(false);
    const [apptError, setApptError] = useState<string | null>(null);

    useEffect(() => {
        // Mock check for Trial plan. In a real app, this would come from the user's subscription data
        // For demonstration, we assume all users are on Trial initially or check specific metadata
        const plan = 'Trial'; // This should ideally be derived from user metadata or a subscription hook
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

        if (plan === 'Trial') {
            if (!hasSeenOnboarding) {
                setShowOnboarding(true);
            }

            // Trigger AI Analysis for Revenue Triggers (Simulation)
            // We simulate checking the agenda status. 
            // If appointments are low, we send "agenda vazia" to trigger the Flash Promo tip.
            // In a real generic agent, this would be an automatic background "insight" check.
            const isAgendaEmpty = appointments.length < 5; // Simplified logic
            if (isAgendaEmpty) {
                // Slight delay to simulate analysis after load
                setTimeout(() => {
                    searchServices('agenda vazia', services);
                }, 1500);
            }
        }
    }, [appointments.length, services]); // Depend on appointments to re-trigger if they change (simplified)

    const handleDismissOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
            case 'canceled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'no_show': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
            default: return 'bg-primary/10 text-primary border-primary/20'; // scheduled
        }
    };

    const calculatePosition = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);

        const startHour = start.getHours();
        const startMin = start.getMinutes();
        const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);

        // Grid starts at 8:00. Height of 1 hour = 80px (approx)
        // We'll use absolute positioning for now relative to the container
        const topOffset = (startHour - 8) * 80 + (startMin / 60) * 80;
        const height = (durationMin / 60) * 80;

        return { top: `${topOffset}px`, height: `${height}px` };
    };

    const handleCreateAppointment = async () => {
        if (!newApptForm.clientId || !newApptForm.serviceId || !newApptForm.staffId) {
            setApptError('Preencha todos os campos obrigatórios');
            return;
        }
        setIsCreatingAppt(true);
        setApptError(null);

        const selectedService = services.find(s => s.id === newApptForm.serviceId);
        const [hours, minutes] = newApptForm.time.split(':').map(Number);

        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (selectedService?.duration_minutes || 60));

        const result = await createAppointment({
            clientId: newApptForm.clientId,
            serviceId: newApptForm.serviceId,
            staffId: newApptForm.staffId,
            startTime,
            endTime,
            notes: newApptForm.notes
        });

        if (result.success) {
            setShowNewApptModal(false);
            setNewApptForm({ clientId: '', serviceId: '', staffId: '', time: '09:00', notes: '' });
        } else {
            setApptError(result.error || 'Erro ao criar agendamento');
        }
        setIsCreatingAppt(false);
    };

    return (
        <div className="relative flex flex-col h-full gap-4">
            {showOnboarding && <OnboardingTrial onDismiss={handleDismissOnboarding} />}

            {proactiveTip && (
                <div className="relative z-10">
                    <AITipCard tip={proactiveTip} onDismiss={() => setProactiveTip(null)} />
                </div>
            )}

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-md transition-shadow">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <button onClick={() => setSelectedDate(new Date())} className="px-4 text-sm font-semibold hover:bg-white dark:hover:bg-white/10 rounded-md transition-shadow">
                            Hoje
                        </button>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-md transition-shadow">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                        {formatDate(selectedDate)}
                    </h2>
                </div>

                <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
                    <button onClick={() => setShowNewApptModal(true)} className="flex-1 md:flex-none bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition-all">
                        <span className="material-symbols-outlined">add</span>
                        <span className="hidden sm:inline">Novo Agendamento</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] overflow-hidden flex flex-col relative h-[600px] md:h-auto overflow-y-auto">
                {loading && (
                    <div className="absolute inset-0 z-20 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                )}

                <div className="relative min-w-[600px]">
                    {/* Time Column */}
                    {TIME_SLOTS.map((hour) => (
                        <div key={hour} className="flex border-b border-gray-100 dark:border-white/5 h-[80px]">
                            <div className="w-16 border-r border-[#d2e5dd] dark:border-[#2a4035] flex justify-center pt-2 text-xs font-medium text-slate-400">
                                {hour}:00
                            </div>
                            <div className="flex-1 relative group">
                                {/* Horizontal lines for half hours if needed, or hover effects */}
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-50 dark:bg-white/5 border-dashed"></div>
                            </div>
                        </div>
                    ))}

                    {/* Appointments Layer */}
                    <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none">
                        {appointments.map((appt) => {
                            const pos = calculatePosition(appt.start_time, appt.end_time);
                            if (parseInt(pos.top) < 0) return null; // Skip if before start of day (logic improvement needed for real app)

                            return (
                                <div
                                    key={appt.id}
                                    className={`absolute left-2 right-4 pointer-events-auto rounded-lg border p-2 shadow-sm cursor-pointer hover:brightness-95 transition-all min-h-[40px] ${getStatusColor(appt.status)}`}
                                    ref={(el) => {
                                        if (el) {
                                            el.style.top = pos.top;
                                            el.style.height = pos.height;
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm truncate">{appt.client?.name || 'Cliente sem nome'}</span>
                                        <span className="text-[10px] font-bold uppercase opacity-70 tracking-wider bg-black/5 px-1 rounded">{appt.status}</span>
                                    </div>
                                    <div className="text-xs opacity-90 truncate mt-0.5">
                                        {appt.service?.name} {appt.professional ? `• ${appt.professional.name}` : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* New Appointment Modal */}
            {showNewApptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Agendamento</h2>
                            <button onClick={() => setShowNewApptModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {apptError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                    {apptError}
                                </div>
                            )}

                            <div>
                                <label htmlFor="apptClient" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
                                <select
                                    id="apptClient"
                                    value={newApptForm.clientId}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, clientId: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Selecione um cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="apptService" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serviço *</label>
                                <select
                                    id="apptService"
                                    value={newApptForm.serviceId}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, serviceId: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Selecione um serviço</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min - R${s.price})</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="apptStaff" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profissional *</label>
                                <select
                                    id="apptStaff"
                                    value={newApptForm.staffId}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, staffId: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Selecione um profissional</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="apptTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário *</label>
                                <input
                                    id="apptTime"
                                    type="time"
                                    value={newApptForm.time}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, time: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label htmlFor="apptNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                                <textarea
                                    id="apptNotes"
                                    placeholder="Observações..."
                                    rows={2}
                                    value={newApptForm.notes}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                            <button onClick={() => setShowNewApptModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg">
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateAppointment}
                                disabled={isCreatingAppt}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50"
                            >
                                {isCreatingAppt ? 'Salvando...' : 'Agendar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaScreen;

