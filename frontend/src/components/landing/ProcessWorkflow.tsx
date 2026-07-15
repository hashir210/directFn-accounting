"use client";

import { CreditCard, Tag, Landmark, FileCheck } from "lucide-react";

export function ProcessWorkflow() {
  const steps = [
    {
      number: "1",
      title: "Connect Bank Feed",
      description: "Securely link your organizational accounts. Transactions are synced in real-time with double-entry validation.",
      icon: CreditCard
    },
    {
      number: "2",
      title: "Allocate Funds",
      description: "Tag donations and grants to specific restricted or unrestricted asset buckets using standard codes.",
      icon: Tag
    },
    {
      number: "3",
      title: "Track Cost Centers",
      description: "Assign operational expenses to specific schools, departments, or research programs instantly.",
      icon: Landmark
    },
    {
      number: "4",
      title: "Export GAAP Audits",
      description: "Generate compliant balance sheets, cash flows, and statements of activities in a single click.",
      icon: FileCheck
    }
  ];

  return (
    <section className="py-24 bg-zinc-950 text-white relative overflow-hidden border-t border-zinc-900 px-4 sm:px-6 lg:px-8">
      {/* Glow overlays */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="max-w-2xl mb-16 text-left">
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-3">
            Workflow Process
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-white mb-4">
            From entry to statement in minutes.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base font-sans font-light leading-relaxed">
            Four simple steps to enforce ironclad compliance and streamline accounting ledgers.
          </p>
        </div>

        {/* 4-Step Numbered Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number} 
                className="group relative bg-zinc-900/35 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:bg-zinc-900/60 hover:border-zinc-700/80 transition-all duration-300 min-h-[220px] overflow-hidden"
              >
                {/* Big watermark outline number in corner */}
                <div className="absolute -top-4 -right-2 text-7xl font-display font-black text-zinc-900 select-none opacity-40 group-hover:text-zinc-800 transition-colors duration-300">
                  {step.number}
                </div>

                <div className="relative z-10">
                  {/* Icon Wrapper */}
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  
                  {/* Step title */}
                  <h3 className="font-display font-bold text-base text-zinc-100 mb-2">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-zinc-400 text-xs leading-relaxed font-sans font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
