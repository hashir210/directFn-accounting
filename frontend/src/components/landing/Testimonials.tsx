"use client";

import React, { useState } from "react";
import { Star, TrendingUp, Shirt, Factory, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const data = [
  {
    company: "Loom & Co.",
    icon: Shirt,
    quote: "FinFlow changed how we track inventory assets and cost centers. Auditing our textile production previously took weeks, but with their allocation engine, it's done in two clicks.",
    author: "Andrea Clark",
    role: "Finance Director, Loom & Co.",
    initials: "AC",
    stats: [
      { value: "87%", label: "Increase in cost visibility" },
      { value: "38%", label: "Increase in operational efficiency" }
    ]
  },
  {
    company: "Apex Manufacturing",
    icon: Factory,
    quote: "The seamless integration with our supply chain systems has made FinFlow indispensable. It drastically cut down our reconciliation time across all our global factories.",
    author: "Marcus Peterson",
    role: "VP of Finance, Apex",
    initials: "MP",
    stats: [
      { value: "92%", label: "Faster month-end close" },
      { value: "45%", label: "Reduction in manual errors" }
    ]
  },
  {
    company: "Global Supply",
    icon: Package,
    quote: "FinFlow provides unparalleled insights into our logistics cash flow. The real-time dashboards allow us to make strategic shipping decisions with absolute confidence.",
    author: "Sarah Jenkins",
    role: "CFO, Global Supply",
    initials: "SJ",
    stats: [
      { value: "95%", label: "Accuracy in cash forecasting" },
      { value: "60%", label: "Time saved on reporting" }
    ]
  },
  {
    company: "Nordic Retail",
    icon: ShoppingBag,
    quote: "Managing multi-store ledgers used to be a nightmare before FinFlow. Now, we can consolidate financials across all our retail outlets in just a few clicks.",
    author: "David Chen",
    role: "Global Controller, Nordic Retail",
    initials: "DC",
    stats: [
      { value: "99%", label: "Compliance with tax regulations" },
      { value: "50%", label: "Reduction in audit duration" }
    ]
  }
];

export function Testimonials() {
  const [activeTab, setActiveTab] = useState(0);
  const activeData = data[activeTab];

  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-950/40 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            Endorsed by industry leaders
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-sans font-light leading-relaxed">
            Industry leaders trust our commitment to excellence, validating our innovative solutions and fostering partnerships.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
          {data.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === index;
            return (
              <button
                key={item.company}
                onClick={() => setActiveTab(index)}
                className={cn(
                  "flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer",
                  isActive 
                    ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md transform scale-105" 
                    : "bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400")} />
                <span>{item.company}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Card */}
        <div className="bg-zinc-100/50 dark:bg-zinc-900/30 rounded-3xl p-4 sm:p-6 md:p-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
            
            {/* Left Testimonial Panel */}
            <div className="md:col-span-3 bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm relative flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 text-base leading-relaxed font-sans font-light">
                  {activeData.quote}
                </p>
              </div>

              <div className="flex items-center justify-between mt-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary text-base font-bold font-display rounded-full flex items-center justify-center">
                    {activeData.initials}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{activeData.author}</h4>
                    <p className="text-xs text-muted-foreground">{activeData.role}</p>
                  </div>
                </div>
                {/* Quote Icon styling like the image (two thick slashes/quotes) */}
                <div className="text-emerald-700 dark:text-emerald-500 font-serif text-6xl font-black leading-none opacity-80 select-none">
                  &#8221;
                </div>
              </div>
            </div>

            {/* Right Stats Panel */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm flex flex-col justify-center gap-8">
              {activeData.stats.map((stat, i) => (
                <div key={i} className={cn(
                  "flex flex-col",
                  i === 0 ? "pb-8 border-b border-zinc-100 dark:border-zinc-800" : ""
                )}>
                  <div className="flex items-start space-x-2 mb-2">
                    <span className="text-4xl font-bold font-display tracking-tight text-zinc-900 dark:text-zinc-50">
                      {stat.value}
                    </span>
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1" strokeWidth={3} />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug pr-4">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
