"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Play, Shield, Loader2 } from "lucide-react";
import { SiExpedia } from "react-icons/si";
import { FaMicrosoft, FaSalesforce, FaGoogle, FaAmazon } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  email: z.string().min(1, "Please enter your email.").email("Please enter a valid email address.")
});
type FormValues = z.infer<typeof formSchema>;

export function Hero() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSending(true);
    try {
      await apiFetch('/api/v1/contact', {
        method: 'POST',
        body: JSON.stringify({ email: values.email, name: '', message: 'Get Started - Landing Page' }),
      });
      setSubmitted(true);
      form.reset();
    } catch {
      setSubmitted(true);
      form.reset();
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
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full justify-center animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex flex-col w-full max-w-sm">
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center w-full bg-white dark:bg-zinc-900 p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-full focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary shadow-sm transition-all">
              <input
                type="email"
                placeholder="Enter work email"
                {...form.register("email")}
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-sans"
              />
              <button
                type="submit"
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-semibold rounded-full px-6 py-2.5 transition-colors flex items-center space-x-1"
              >
                <span>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Free"}</span>
              </button>
            </form>
            {form.formState.errors.email && (
              <p className="text-destructive text-[13px] font-medium text-left px-4 mt-2">
                {form.formState.errors.email.message}
              </p>
            )}
            {submitted && (
              <div className="mt-2 px-4 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium flex items-center gap-2 text-left">
                <CheckCircle className="h-4 w-4" /> We've received your request!
              </div>
            )}
          </div>
          
          <button className="flex items-center justify-center space-x-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors py-[13px] px-6 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0">
            <Play className="h-4 w-4 fill-current" />
            <span>Watch Demo</span>
          </button>
        </div>

      </div>

      {/* SaaS Showcase Browser Mockup */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 animate-in fade-in duration-1000 delay-300">
        {/* Glow behind the mockup */}
        <div className="absolute inset-0 -z-10 bg-primary/10 dark:bg-primary/20 blur-[120px] rounded-[3rem]" />
        
        <Card className="rounded-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
          {/* Mac-style Browser Top Bar */}
          <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
          </div>
          
          {/* Image Content */}
          <CardContent className="p-0 bg-zinc-100 dark:bg-zinc-900">
            <img 
              src="/dashboard-preview.png" 
              alt=""
              className="w-full h-auto object-contain transition-all duration-700 hover:scale-[1.01]"
            />
          </CardContent>
        </Card>
      </div>



    </section>
  );
}
