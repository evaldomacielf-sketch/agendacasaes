
import React from 'react';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, required = true }) => {

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Limits to 11 digits (DDD + 9 digits)
        if (inputValue.length > 11) {
            inputValue = inputValue.slice(0, 11);
        }

        // Apply Mask
        // (XX) XXXXX-XXXX or (XX) XXXX-XXXX
        let formattedValue = inputValue;
        if (inputValue.length > 2) {
            formattedValue = `(${inputValue.slice(0, 2)}) ${inputValue.slice(2)}`;
        }
        if (inputValue.length > 7) {
            // Check if it's 8 or 9 digits
            if (inputValue.length === 11) {
                formattedValue = `(${inputValue.slice(0, 2)}) ${inputValue.slice(2, 7)}-${inputValue.slice(7)}`;
            } else {
                formattedValue = `(${inputValue.slice(0, 2)}) ${inputValue.slice(2, 6)}-${inputValue.slice(6)}`;
            }
        }

        onChange(inputValue); // Pass raw digits or formatted? 
        // Usually parents want raw, but here the parent implementation seems to expect the value being passed back to be set directly?
        // Looking at SignupPage: onChange(setPhone) -> value={phone}.
        // If I pass clean digits, the input display will lose formatting unless I format it back on render.
        // Let's pass the FORMATTED value to the parent state for simple display, 
        // OR changing the parent to expect clean value.
        // Given the SignupPage uses `phone.replace(/\D/g, '')` validation, it expects the value to potentially have chars.
        // So I will update the parent state with the FORMATTED value.

        // Wait, better approach for controlled input:
        // Update parent with the masked value so the input reflects it.
        // But I generated `formattedValue` based on `inputValue` (cleansed).
        // Let's pass `formattedValue` to parent.
        onChange(formattedValue);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">WhatsApp / Telefone</label>
            <div className="relative">
                <input
                    type="tel"
                    placeholder="(27) 99999-9999"
                    value={value}
                    onChange={handleInput}
                    required={required}
                    className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                    <span className="material-symbols-outlined filled-icon text-[20px]">call</span>
                </span>
            </div>
        </div>
    );
};
