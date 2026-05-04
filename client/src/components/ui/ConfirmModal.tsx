import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
      button: 'bg-red-600 hover:bg-red-500 shadow-red-500/25'
    },
    warning: {
      icon: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
      button: 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/25'
    },
    info: {
      icon: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
    }
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md pointer-events-auto bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
                    <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-6">
                <p className="text-slate-300 leading-relaxed">{message}</p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-5 py-4 border-t border-slate-700 bg-slate-900">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 ${styles.button} text-white font-bold py-3 rounded-xl transition-all shadow-lg`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
