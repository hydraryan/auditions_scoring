import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
  secondary:
    'bg-surface text-app border border-app hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
  ghost:
    'bg-transparent text-app hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
};

const SIZE: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-sm rounded',
  md: 'px-3 py-2 text-sm rounded',
  lg: 'px-4 py-2.5 text-base rounded-md',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const cls = `${base} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? '…' : children}
    </button>
  );
};

export default Button;
