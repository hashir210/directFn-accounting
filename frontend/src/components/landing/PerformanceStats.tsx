"use client";

import { Check, Shield, TrendingUp, Star, Users } from "lucide-react";

export function PerformanceStats() {
  return (
    <section className="py-24 bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-100 dark:border-zinc-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-3">
            Why FinFlow
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 tracking-tight">
            Why organizations prefer FinFlow
          </h2>
        </div>

        {/* 3-Part Grid inspired by the 'Suite' screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Card 1: 99.9% Audit Accuracy (Left Column) */}
          <div className="lg:col-span-4 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="inline-flex items-center space-x-1 text-primary font-display font-extrabold text-4xl mb-6">
                <span>99.9%</span>
              </div>
              <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
                Audit & Compliance Accuracy
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-sans font-light leading-relaxed mb-6">
                Never fear audits again. Our automated controls enforce strict double-entry checks.
              </p>
              
              <ul className="space-y-3">
                {[
                  "FASB ASC 958 compliant logging",
                  "Automated grant bucket checks",
                  "GAAP compliant reporting formats"
                ].map((item) => (
                  <li key={item} className="flex items-start text-xs font-sans text-zinc-600 dark:text-zinc-400">
                    <span className="mr-2.5 p-0.5 bg-primary/10 text-primary rounded-full shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-8 flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Shield className="h-4.5 w-4.5" />
              <span>Certified FASB Compliance Tracker</span>
            </div>
          </div>

          {/* Card 2: 10x Faster Reports (Center - Wide Column with Trend Line Graph) */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300 overflow-hidden relative">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Efficiency gains</span>
                  <h3 className="font-display font-extrabold text-4xl text-primary">10x</h3>
                </div>
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              
              <h4 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-3">
                Faster Monthly Reports
              </h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-sans font-light leading-relaxed mb-6">
                Generate GAAP activities reports, cash flow ledgers, and functional expense files in seconds instead of weeks.
              </p>
            </div>

            {/* Custom SVG Trend Graph (Matches the graph widget in the 'Suite' reference) */}
            <div className="w-full pt-4 relative">
              <span className="text-[9px] font-mono text-zinc-400 absolute top-0 left-0">Reconciliation Rate</span>
              <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,75 Q37.5,70 75,60 T150,45 T225,25 T300,10 L300,80 L0,80 Z"
                  fill="url(#gradient-trend)"
                />
                <path
                  d="M0,75 Q37.5,70 75,60 T150,45 T225,25 T300,10"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                />
                <circle cx="300" cy="10" r="4" fill="#7c3aed" />
              </svg>
              <div className="flex justify-between text-[9px] text-zinc-400 mt-2 font-mono">
                <span>Legacy Tool (Weeks)</span>
                <span>FinFlow (Seconds)</span>
              </div>
            </div>
          </div>

          {/* Card 3: 5k+ World-Changers (Right Column) */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-display font-extrabold text-4xl text-zinc-900 dark:text-zinc-50 mb-3">
                5k+
              </h3>
              <h4 className="font-display font-bold text-base text-zinc-800 dark:text-zinc-200 mb-4">
                Active Non-Profits
              </h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-sans font-light leading-relaxed">
                Empowering universities, community schools, and global foundations to spend their grants with total confidence.
              </p>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-8">
              <div className="flex items-center space-x-1 text-amber-500 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
              <span className="text-[10px] text-zinc-400 block">Average User Rating</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
