import React from 'react';
import { cn } from '@/lib/utils';

export function PulseIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex h-[6px] w-[6px] items-center justify-center", className)}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-30 animate-pulse-ring"></span>
      <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-brand-accent"></span>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
}
