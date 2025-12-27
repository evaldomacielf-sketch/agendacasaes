import React from 'react';
import { useNotificationStats } from '../../hooks/useNotificationStats';
import { Bell, Clock, Mail, MessageSquare, Smartphone } from 'lucide-react';

const NotificationsPanel: React.FC = () => {
    const { stats, loading } = useNotificationStats();

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail size={12} />;
            case 'sms': return <MessageSquare size={12} />;
            case 'push': return <Smartphone size={12} />;
            default: return <Bell size={12} />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Em breve';
        if (diffHours < 24) return `Em ${diffHours}h`;
        const diffDays = Math.round(diffHours / 24);
        return `Em ${diffDays}d`;
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-xl shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-100 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-50 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell size={20} className="text-primary" />
                    Notificações
                </h3>
                <span className="text-xs text-gray-500">Últimos 7 dias</span>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 p-4 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enviadas</p>
                        <p className="text-3xl font-bold text-primary">{stats.sentLast7Days}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Mail size={24} className="text-primary" />
                    </div>
                </div>
            </div>

            {/* Upcoming List */}
            <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
                    <Clock size={14} />
                    Próximos Lembretes
                </h4>

                {stats.upcomingReminders.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                        Nenhum lembrete agendado.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {stats.upcomingReminders.map((reminder) => (
                            <div
                                key={reminder.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                        {reminder.appointment?.client?.name || 'Cliente'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {reminder.appointment?.service?.name || 'Serviço'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <div className="flex gap-1">
                                        {reminder.channels.map((ch) => (
                                            <span
                                                key={ch}
                                                className="p-1 bg-white dark:bg-gray-800 rounded text-gray-500"
                                                title={ch}
                                            >
                                                {getChannelIcon(ch)}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                        {formatTime(reminder.scheduled_time)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
