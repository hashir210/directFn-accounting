"use client";

import { Heart, Landmark, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeatureGrid() {
  const features = [
    {
      title: "Fundraising CRM",
      description: "Build robust donor profiles and log communication pipelines.",
      icon: Heart,
      color: "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
      href: "/login",
      colSpan: "lg:col-span-4"
    },
    {
      title: "Double-Entry Ledger",
      description: "Manage unrestricted assets and restricted grants in real-time.",
      icon: Landmark,
      color: "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
      href: "/login",
      colSpan: "lg:col-span-8"
    },
    {
      title: "Compliance Auditing",
      description: "Automate GAAP statements and lock accounts to prevent changes.",
      icon: ShieldCheck,
      color: "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm",
      image: "https://images.unsplash.com/photo-1554224154-26032ffc0d04?q=80&w=1200&auto=format&fit=crop",
      href: "/login",
      colSpan: "lg:col-span-12"
    }
  ];

  return (
    <section id="products" className="py-24 bg-white dark:bg-zinc-950 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-zinc-100 dark:border-zinc-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            Everything you need to manage finances efficiently.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-sans font-light leading-relaxed">
            Eliminate spreadsheets and manual reconciliation. FinFlow wraps core accounting controls inside a sleek, modern interface.
          </p>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            // The last item spans full width and uses a horizontal layout for larger screens
            const isWide = feat.colSpan === "lg:col-span-12";
            
            return (
              <div 
                key={feat.title} 
                className={`${feat.colSpan} group relative bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex ${isWide ? 'flex-col md:flex-row' : 'flex-col'}`}
              >
                {/* Background Image Mask */}
                <div className={`absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700 ${isWide ? 'md:w-1/2 md:right-0 md:left-auto md:h-full w-full h-1/2 top-0' : 'h-1/2 top-0 w-full'}`}>
                  <img src={feat.image} alt={feat.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 dark:from-zinc-900 to-transparent"></div>
                  {isWide && <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-transparent to-zinc-100 dark:to-zinc-900"></div>}
                </div>

                {/* Content Overlay */}
                <div className={`relative z-10 p-8 sm:p-10 flex flex-col justify-end h-full ${isWide ? 'md:w-1/2' : 'pt-40'}`}>
                  
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${feat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="font-display font-bold text-2xl text-zinc-900 dark:text-zinc-100 mb-3">
                    {feat.title}
                  </h3>
                  
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-8 font-sans font-light max-w-sm">
                    {feat.description}
                  </p>
                  
                  <Link
                    href={feat.href}
                    className="inline-flex items-center text-sm font-semibold text-zinc-900 dark:text-white hover:text-primary transition-colors group/link mt-auto w-fit"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
