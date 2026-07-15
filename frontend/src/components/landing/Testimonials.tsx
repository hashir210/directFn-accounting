"use client";

import { Star, Quote, MessageSquare } from "lucide-react";
import { SiExpedia } from "react-icons/si";
import { FaMicrosoft, FaSalesforce, FaGoogle, FaAmazon } from "react-icons/fa";

export function Testimonials() {
  const reviews = [
    {
      stars: 5,
      quote: "FinFlow changed how we track donor restricted assets. Auditing previously took weeks, but with their cost center allocation engine, it's done in two clicks.",
      author: "Andrea Clark",
      role: "Finance Director",
      organization: "K-12 School Group",
      initials: "AC"
    },
    {
      stars: 5,
      quote: "The fundraising module syncs seamlessly with our double-entry ledger. Our donors get instant tax-compliant receipts, and our bookkeeping is always error-free.",
      author: "Marcus Peterson",
      role: "Treasurer",
      organization: "World Education Trust",
      initials: "MP"
    },
    {
      stars: 5,
      quote: "Excellent multi-entity ledger management. The real-time cash flow graphs are incredible for presenting financial health reports directly to our board of trustees.",
      author: "Sarah Jenkins",
      role: "Chief Financial Officer",
      organization: "Beacon Foundation",
      initials: "SJ"
    }
  ];

  const brandLogos = [
    { name: "Expedia", icon: SiExpedia },
    { name: "Microsoft", icon: FaMicrosoft },
    { name: "Salesforce", icon: FaSalesforce },
    { name: "Google", icon: FaGoogle },
    { name: "Amazon", icon: FaAmazon }
  ];

  return (
    <section className="py-24 bg-zinc-50/50 dark:bg-zinc-950/40 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <div className="text-primary font-bold text-xs uppercase tracking-widest mb-3 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Testimonials</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            What customer say about us
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-sans font-light leading-relaxed">
            Leading schools and global foundations manage assets and audit ledgers using FinFlow.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {reviews.map((rev, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 rounded-3xl relative shadow-xs hover:shadow-md hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Quotes floating background */}
                <Quote className="absolute top-6 right-8 h-10 w-10 text-zinc-100 dark:text-zinc-800/60 pointer-events-none z-0" />
                
                {/* Stars */}
                <div className="flex items-center space-x-1 mb-6 relative z-10">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-8 relative z-10 font-sans font-light italic">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center space-x-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 relative z-10">
                <div className="w-10 h-10 bg-primary/10 text-primary text-sm font-bold font-display rounded-full flex items-center justify-center">
                  {rev.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{rev.author}</h4>
                  <p className="text-[10px] text-muted-foreground">{rev.role}, {rev.organization}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trusted Partners / Brands Ticker */}
        <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-16">
          <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-10">
            Empowering organizations trusted worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 opacity-40 dark:opacity-30">
            {brandLogos.map((brand) => {
              const BrandIcon = brand.icon;
              return (
                <div key={brand.name} className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors duration-200">
                  <BrandIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                  <span className="font-display font-semibold text-sm sm:text-base tracking-tight">{brand.name}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
