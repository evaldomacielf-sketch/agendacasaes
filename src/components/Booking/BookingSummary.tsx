import React from 'react';
import { Service } from '../../hooks/useServices';

interface BookingSummaryProps {
    selectedServices: string[];
    services: Service[];
    selectedDate: Date;
    selectedTime: string | null;
    totalValue: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
    selectedServices,
    services,
    selectedDate,
    selectedTime,
    totalValue
}) => {
    const selectedServicesData = services.filter(s => selectedServices.includes(s.id));

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Resumo
            </h3>

            <div className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-gray-400 mt-0.5">calendar_clock</span>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-sm text-primary font-bold">
                            às {selectedTime || '--:--'}
                        </p>
                    </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Serviços</p>
                    {selectedServicesData.map(service => (
                        <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">{service.name}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-2"></div>

                {/* Total */}
                <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="font-extrabold text-xl text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                    </span>
                </div>
            </div>
        </div>
    );
};
