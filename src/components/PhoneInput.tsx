import React, { useState } from 'react';

export const PhoneInput: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const maskPhone = (v: string) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskPhone(e.target.value);
        // Limit to 15 characters: (DD) DDDDD-DDDD
        if (masked.length <= 15) {
            // Envia apenas os números para o estado pai (Supabase)
            onChange(e.target.value.replace(/\D/g, ""));
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">Telefone / WhatsApp</label>
            <div className="relative">
                <input
                    type="tel"
                    placeholder="(27) 99999-9999"
                    value={maskPhone(value)}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                    <span className="material-symbols-outlined filled-icon text-[20px]">call</span>
                </span>
            </div>
        </div>
    );
};
