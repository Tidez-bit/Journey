import { InputHTMLAttributes, forwardRef } from 'react';
import { Info } from 'lucide-react';

export interface EnhancedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  required?: boolean;
  icon?: React.ElementType;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ label, error, hint, prefix, suffix, required, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {/* Label */}
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400">*</span>}
          {hint && (
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 
                              bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                              transition-all whitespace-nowrap z-10">
                {hint}
              </div>
            </div>
          )}
        </label>

        {/* Input Container */}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon className="w-5 h-5" />
            </div>
          )}

          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 
                            px-2 py-1 bg-slate-800 rounded text-sm text-slate-400">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-3 py-2 rounded-lg
              bg-slate-900/50 border border-slate-700
              text-white placeholder:text-slate-500
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              hover:border-slate-600
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${Icon ? 'pl-10' : ''}
              ${prefix ? 'pl-16' : ''}
              ${suffix ? 'pr-16' : ''}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${className || ''}
            `}
            {...props}
          />

          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 
                            px-2 py-1 bg-slate-800 rounded text-sm text-slate-400">
              {suffix}
            </div>
          )}
        </div>

        {/* Error Message */}
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

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
