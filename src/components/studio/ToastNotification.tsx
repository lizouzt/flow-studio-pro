'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastNotificationProps {
  toast: ToastState | null;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 max-w-md ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : toast.type === 'success'
              ? 'bg-emerald-500 text-black'
              : 'bg-amber-500 text-black'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <Check className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
