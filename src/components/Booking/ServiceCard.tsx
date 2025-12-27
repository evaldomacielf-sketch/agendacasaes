import React from 'react';
import { Service } from '../../hooks/useServices';

interface ServiceCardProps {
    service: Service;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onToggle }) => {
    return (
        <div
            onClick={() => onToggle(service.id)}
            className={`
                relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2
                ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-transparent bg-white dark:bg-surface-dark shadow-sm hover:border-gray-200 dark:hover:border-gray-700'
                }
                group
            `}
        >
            {/* Image (Optional - if we have it, layout changes slightly, but for now simple list style) */}
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-lg leading-tight ${isSelected ? 'text-primary-dark' : 'text-slate-900 dark:text-gray-100'}`}>
                        {service.name}
                    </h3>
                    {/* Checkbox Visual */}
                    <div className={`
                        shrink-0 w-6 h-6 rounded-full border-2 ml-3 flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary/50'}
                    `}>
                        {isSelected && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                    </div>
                </div>

                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>

                <div className="flex items-center gap-4 mt-3">
                    <span className="text-primary font-bold text-lg">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                    </span>
                    <div className="flex items-center text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                        {service.duration_minutes} min
                    </div>
                </div>
            </div>
        </div>
    );
};
