import React, { useRef, useEffect } from 'react';

interface DateHorizontalPickerProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    daysCount?: number;
}

export const DateHorizontalPicker: React.FC<DateHorizontalPickerProps> = ({ selectedDate, onSelectDate, daysCount = 14 }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const dates = Array.from({ length: daysCount }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

    // Capitalize first letter of day
    const getDayName = (d: Date) => {
        const name = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    return (
        <div className="relative">
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-1 snap-x"
            >
                {dates.map((date, i) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <button
                            key={i}
                            onClick={() => onSelectDate(date)}
                            className={`
                                flex flex-col items-center justify-center min-w-[70px] h-[84px] rounded-2xl border-2 transition-all p-2 snap-center
                                ${isSelected
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-105'
                                    : 'bg-white dark:bg-surface-dark border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-500'
                                }
                            `}
                        >
                            <span className={`text-xs font-medium uppercase mb-1 ${isSelected ? 'text-primary-foreground/80' : 'text-gray-400'}`}>
                                {isToday ? 'Hoje' : getDayName(date)}
                            </span>
                            <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                {date.getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>
            {/* Fade effect on right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent pointer-events-none"></div>
        </div>
    );
};
