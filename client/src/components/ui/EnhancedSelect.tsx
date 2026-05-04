import React, { SelectHTMLAttributes, forwardRef } from 'react';

export interface EnhancedSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string; icon?: React.ElementType }[];
}

export const EnhancedSelect = forwardRef<HTMLSelectElement, EnhancedSelectProps>(
  ({ label, error, required, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>

        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 rounded-lg
              bg-slate-900/50 border border-slate-700
              text-white
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              hover:border-slate-600
              transition-all duration-200
              appearance-none cursor-pointer
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${className || ''}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom Dropdown Arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-400 rounded-full" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

EnhancedSelect.displayName = 'EnhancedSelect';

export default EnhancedSelect;
