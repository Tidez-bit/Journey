import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface EnhancedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const EnhancedTextarea = forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ label, error, required, maxLength, showCount = true, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>

        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg
            bg-slate-900/50 border border-slate-700
            text-white placeholder:text-slate-500
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            hover:border-slate-600
            transition-all duration-200
            resize-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className || ''}
          `}
          maxLength={maxLength}
          {...props}
        />

        {maxLength && showCount && (
          <p className="text-xs text-slate-500 text-right">
            {props.value?.toString().length || 0}/{maxLength}
          </p>
        )}

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

EnhancedTextarea.displayName = 'EnhancedTextarea';

export default EnhancedTextarea;
