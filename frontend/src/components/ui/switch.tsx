'use client';

import React from 'react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ id, checked, disabled, onCheckedChange }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-150 focus-visible:outline-none focus-visible:shadow-focus-glow disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-brand-accent shadow-focus-glow' : 'bg-[var(--bg-surface-sunken)] shadow-soft-pressed'
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full ring-0 transition-transform duration-150 ${
          checked ? 'translate-x-5 bg-brand-primary-dark shadow-sm' : 'translate-x-0 bg-white shadow-sm'
        }`}
      />
    </button>
  );
}
