import React from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

export default function Toast() {
  const toast = useStore(state => state.toast);

  if (!toast) return null;

  // Determine toast type and styling based on message content
  const getToastType = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('fail')) {
      return { type: 'error', icon: X, bgColor: 'bg-red-600', iconColor: 'text-white' };
    }
    if (lowerMessage.includes('warning') || lowerMessage.includes('alert')) {
      return { type: 'warning', icon: AlertCircle, bgColor: 'bg-yellow-600', iconColor: 'text-white' };
    }
    if (lowerMessage.includes('info') || lowerMessage.includes('note')) {
      return { type: 'info', icon: Info, bgColor: 'bg-blue-600', iconColor: 'text-white' };
    }
    // Default to success
    return { type: 'success', icon: Check, bgColor: 'bg-charcoal', iconColor: 'text-gold' };
  };

  const { icon: Icon, bgColor, iconColor } = getToastType(toast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[200] max-w-sm"
        >
          <div className={`${bgColor} text-white py-3.5 px-5 rounded shadow-xl flex items-center gap-2.5 text-sm min-w-[240px]`}>
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
            <span>{toast}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
