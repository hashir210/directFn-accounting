"use client";

import { useState } from "react";
import { ArrowRight, Star, TrendingUp, CheckCircle, Shield } from "lucide-react";
import { SiExpedia } from "react-icons/si";
import { FaMicrosoft, FaSalesforce, FaGoogle, FaAmazon } from "react-icons/fa";

export function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
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
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-36 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background gradients and grid pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-violet-400/10 rounded-full filter blur-3xl opacity-50 z-0 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-indigo-400/5 rounded-full filter blur-3xl opacity-50 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Heading and Form */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Main Headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] text-zinc-900 dark:text-zinc-50 mb-6">
              Manage Fund <br />
              Accounting Smarter <br />
              with FinFlow.
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mb-8 font-sans font-light leading-relaxed">
              An intuitive double-entry general ledger, automated donor pipeline, and compliant audit tracker designed built specifically for non-profits and schools.
            </p>

            {/* Unified Email Input Pill (Sleek layout from Suite reference) */}
            <div className="w-full max-w-md mb-8">
              {submitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-full flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 font-sans text-sm">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>Success! We will contact you soon.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex items-center bg-zinc-50 dark:bg-zinc-900/60 p-1.5 border border-zinc-200/80 dark:border-zinc-800/80 rounded-full focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <input
                    type="email"
                    required
                    placeholder="Enter your organizational email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-full px-5 py-3 transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Layered Dashboard Mockup (3D Effect) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Base Glowing Orb */}
            <div className="absolute inset-0 bg-primary/10 rounded-full filter blur-3xl opacity-40 z-0 scale-75 pointer-events-none"></div>

            {/* Main Browser Dashboard Preview */}
            <div className="w-full max-w-lg rounded-xl bg-zinc-950 border border-zinc-800/80 shadow-2xl overflow-hidden relative z-10 transition-all duration-500 hover:border-zinc-700">
              
              {/* Window Controls */}
              <div className="bg-zinc-900/60 px-4 py-2.5 flex items-center justify-between border-b border-zinc-800/60">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/85"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/85"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/85"></div>
                </div>
                <div className="bg-zinc-950/80 px-6 py-0.5 text-[10px] text-zinc-500 rounded font-mono">
                  app.finflow.com/ledger
                </div>
                <div className="w-8"></div>
              </div>

              {/* Mock Dashboard View */}
              <div className="p-4 bg-zinc-950 text-left font-sans">
                
                {/* Balance Header */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Restricted Ledger Balance</span>
                    <h3 className="text-lg font-bold text-zinc-100">$24,746.00</h3>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    <span>+12.4%</span>
                  </div>
                </div>

                {/* SVG Area Chart */}
                <div className="w-full h-32 relative mb-4">
                  <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="glow-violet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,100 Q40,60 80,75 T160,40 T240,55 T320,25 T400,15 L400,120 L0,120 Z"
                      fill="url(#glow-violet)"
                    />
                    <path
                      d="M0,100 Q40,60 80,75 T160,40 T240,55 T320,25 T400,15"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-2.5 rounded-lg">
                    <span className="text-zinc-500">Unrestricted Fund</span>
                    <span className="block font-bold text-zinc-200 mt-0.5">$18,290.00</span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-2.5 rounded-lg">
                    <span className="text-zinc-500">Restricted Grants</span>
                    <span className="block font-bold text-zinc-200 mt-0.5">$6,456.00</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Overlapping Glassmorphism Card (3D Floating Overlay) */}
            <div className="absolute -bottom-6 -left-6 z-20 bg-white/10 dark:bg-zinc-900/40 backdrop-blur-md border border-white/20 dark:border-zinc-800/40 p-4 rounded-xl shadow-xl max-w-[200px] text-left transform -rotate-2 hover:rotate-0 transition-transform duration-300 pointer-events-none">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-violet-500/20 text-violet-300 rounded-lg">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Audit Status</span>
              </div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">GAAP Verified</span>
              <span className="block text-[8px] text-zinc-400 mt-0.5">FASB compliance matched</span>
              
              <div className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-full rounded-full"></div>
              </div>
            </div>

          </div>
          
        </div>

        {/* Grayscale Brand Logo Banner (from Suite reference) */}
        <div className="mt-28 pt-12 border-t border-zinc-100 dark:border-zinc-900">
          <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8">
            Empowering organizations trusted worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16 opacity-35 dark:opacity-20">
            {brandLogos.map((brand) => {
              const BrandIcon = brand.icon;
              return (
                <div key={brand.name} className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors duration-200">
                  <BrandIcon className="h-5.5 w-5.5" />
                  <span className="font-display font-semibold text-sm tracking-tight">{brand.name}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
