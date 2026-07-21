"use client";

import { Heart, Landmark, ShieldCheck, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeatureGrid() {
  const features = [
    {
      title: "Fundraising CRM",
      description: "Build robust donor profiles, log communication pipelines, and run online donation pages that feed directly into your ledgers.",
      icon: Heart,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
      href: "/login"
    },
    {
      title: "Double-Entry Ledger",
      description: "Manage unrestricted assets and restricted grants in real-time, keeping cost centers organized and balanced for immediate audits.",
      icon: Landmark,
      color: "text-violet-500 bg-violet-50 dark:bg-violet-950/20",
      href: "/login"
    },
    {
      title: "Compliance Auditing",
      description: "Automate GAAP statements, track FASB ASC 958 requirements, and lock accounts to prevent retrospect changes.",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      href: "/login"
    }
  ];

  return (
    <section id="products" className="py-24 bg-white dark:bg-zinc-950 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-zinc-100 dark:border-zinc-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="text-primary font-bold text-xs uppercase tracking-widest mb-3 inline-flex items-center">
            <HelpCircle className="h-4 w-4 mr-2" />
            <span>Modules Overview</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            Everything you need to manage finances efficiently.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-sans font-light leading-relaxed">
            Eliminate spreadsheets and manual reconciliation. FinFlow wraps core accounting controls inside a sleek, modern interface.
          </p>
        </div>

        {/* Staggered Minimal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title} 
                className="group bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300"
              >
                <div>
                  {/* Icon Frame */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 ${feat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-3">
                    {feat.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8 font-sans font-light">
                    {feat.description}
                  </p>
                </div>

                {/* Styled Link */}
                <Link
                  href={feat.href}
                  className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors group/link mt-auto"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
