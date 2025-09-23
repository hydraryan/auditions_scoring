import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, hint, error, className = '', id, ...rest }) => {
  const inputId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm mb-1 text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-surface border border-app rounded px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...rest}
      />
      {hint && !error && <div className="mt-1 text-xs text-muted">{hint}</div>}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
};

export default Input;
