import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25",
    secondary: "bg-gray-100 dark:bg-gray-800 text-slate-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700",
    outline: "border border-gray-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5",
    ghost: "text-primary hover:bg-primary/10",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-14 px-6 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};