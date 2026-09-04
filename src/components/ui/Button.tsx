import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', type = 'button', className = '', disabled, onClick }: ButtonProps) {
  const baseClass = 'btn inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mb-0';
  
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary',
    danger: 'bg-danger text-white hover:bg-danger-hover focus:ring-danger',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-primary-lighter hover:text-primary-dark focus:ring-primary dark:bg-transparent dark:border-slate-700 dark:text-slate-200',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800',
  };

  return (
    <button
      type={type}
      className={`${baseClass} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
