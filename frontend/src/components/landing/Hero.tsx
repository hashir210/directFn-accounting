"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Play, Shield, Loader2 } from "lucide-react";
import { SiExpedia } from "react-icons/si";
import { FaMicrosoft, FaSalesforce, FaGoogle, FaAmazon } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

export function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await apiFetch('/api/v1/contact', {
        method: 'POST',
        body: JSON.stringify({ email, name: '', message: 'Get Started - Landing Page' }),
      });
      setSubmitted(true);
      setEmail("");
    } catch {
      setSubmitted(true);
      setEmail("");
    } finally {
      setSending(false);
    }
  };

  const brandLogos = [
    { name: "Expedia", icon: SiExpedia },
    { name: "Microsoft", icon: FaMicrosoft },
    { name: "Salesforce", icon: FaSalesforce },
    { name: "Google", icon: FaGoogle },
    { name: "Amazon", icon: FaAmazon }
  ];

  return (
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/10 rounded-full filter blur-[120px] pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-12 mb-20">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 bg-primary/10 dark:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          <span>Introducing FinFlow 2.0</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter leading-[1.05] text-zinc-900 dark:text-zinc-50 mb-8 animate-in slide-in-from-bottom-6 duration-700">
          The new standard for <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">financial operations.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mb-12 font-sans font-light leading-relaxed animate-in slide-in-from-bottom-8 duration-700">
          FinFlow unites double-entry ledgers, automated reconciliation, and donor CRM into one beautifully crafted platform for non-profits and schools.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-in slide-in-from-bottom-10 duration-700">
          <form onSubmit={handleSubmit} className="flex items-center w-full max-w-sm bg-white dark:bg-zinc-900 p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-full focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary shadow-sm transition-all">
            <input
              type="email"
              required
              placeholder="Enter work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-sans"
            />
            <button
              type="submit"
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-semibold rounded-full px-6 py-2.5 transition-colors flex items-center space-x-1"
            >
              <span>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Free"}</span>
            </button>
          </form>
          <button className="flex items-center justify-center space-x-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-3 px-6 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <Play className="h-4 w-4 fill-current" />
            <span>Watch Demo</span>
          </button>
        </div>

        {submitted && (
          <div className="mt-4 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> We've received your request!
          </div>
        )}

      </div>

      {/* Massive Graphic / Unsplash Image Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 animate-in fade-in duration-1000 delay-300">
        <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl md:rounded-[2rem] overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl relative bg-zinc-100 dark:bg-zinc-900 group">
          {/* Unsplash Image Placeholder */}
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
            alt="Dashboard Dashboard Overview"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
          />
          {/* Glass Overlay Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-black/40 to-transparent pointer-events-none"></div>
          
          {/* Floating UI Elements over image */}
          <div className="absolute -bottom-6 -left-6 z-20 bg-white/70 dark:bg-black/60 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] max-w-[220px] text-left transform -rotate-2 hover:rotate-0 transition-transform duration-300 pointer-events-none hidden md:block">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-primary/20 text-primary rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Reconciled</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">$2.4M Assets</span>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full w-[85%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted Brands */}
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-zinc-100 dark:border-zinc-900 relative z-10">
        <p className="text-center text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-8">
          Trusted by modern finance teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-20 opacity-40 dark:opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          {brandLogos.map((brand) => {
            const BrandIcon = brand.icon;
            return (
              <div key={brand.name} className="flex items-center space-x-2 text-zinc-900 dark:text-white">
                <BrandIcon className="h-6 w-6" />
                <span className="font-display font-semibold text-lg tracking-tight">{brand.name}</span>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
