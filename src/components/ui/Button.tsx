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
  const baseClass = 'btn transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mb-0';
  
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary',
    danger: 'bg-danger text-white hover:bg-danger-hover focus:ring-danger',
    outline: 'border-2 border-primary text-primary hover:bg-primary-light focus:ring-primary',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
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