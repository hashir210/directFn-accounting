'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select components must be used within a Select');
  return ctx;
}

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const { setOpen, open } = useSelectContext();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { selectedLabel } = useSelectContext();
  return <span>{selectedLabel || placeholder || 'Select...'}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open } = useSelectContext();
  if (!open) return null;
  return (
    <div className="relative">
      <div className="absolute top-1 z-50 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in">
        <div className="p-1">{children}</div>
      </div>
    </div>
  );
}

export function SelectItem({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  const { onValueChange, setOpen, value: selectedValue, setSelectedLabel } = useSelectContext();
  const isSelected = selectedValue === value;

  useEffect(() => {
    if (isSelected && typeof children === 'string') {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        onValueChange(value);
        if (typeof children === 'string') {
          setSelectedLabel(children);
        }
        setOpen(false);
      }}
      className={`relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent font-semibold' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
