import React from 'react';
import { Check } from 'lucide-react';
import useStore from '../store/useStore';

export default function Toast() {
  const toast = useStore(state => state.toast);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-charcoal text-white py-3.5 px-5 rounded text-[13px] flex items-center gap-2.5 shadow-lg z-[3000] slide-down min-w-[240px]">
      <Check className="w-[18px] h-[18px] text-gold flex-shrink-0" />
      <span>{toast}</span>
    </div>
  );
}
