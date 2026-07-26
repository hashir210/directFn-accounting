"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaTwitter, FaGithub, FaLinkedin, FaYoutube } from "react-icons/fa";
import { Send, CheckCircle2 } from "lucide-react";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  const footerLinks = [
    {
      title: "Products",
      links: [
        { name: "Ledger", href: "#" },
        { name: "Fundraising CRM", href: "#" },
        { name: "Billing", href: "#" },
        { name: "Compliance", href: "#" },
        { name: "Pricing", href: "#pricing" }
      ]
    },
    {
      title: "Sectors",
      links: [
        { name: "K-12 Schools", href: "#" },
        { name: "Higher Ed", href: "#" },
        { name: "Companies", href: "#" },
        { name: "Foundations", href: "#" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#" },
        { name: "API Reference", href: "#" },
        { name: "Guides", href: "#" },
        { name: "Support Center", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press Kit", href: "#" },
        { name: "Contact Sales", href: "#" }
      ]
    }
  ];

  return (
    <footer id="pricing" className="bg-zinc-950 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative dots background */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Call to Action Card (Violet box in reference) */}
        <div className="bg-primary rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden mb-20 shadow-2xl border border-violet-500/35">
          {/* Glowing gradient circle */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-400/20 rounded-full filter blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div className="max-w-xl text-left">
              <span className="text-violet-200 text-xs font-bold uppercase tracking-widest block mb-2">Join the future</span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4">
                Want to join?
              </h2>
              <p className="text-violet-100 text-sm font-sans font-light leading-relaxed">
                Connect your organization and streamline cash flow tracing. Request a demo with our financial engineers.
              </p>
            </div>

            {/* Email form */}
            <div className="w-full md:w-auto min-w-[280px] sm:min-w-[400px]">
              {submitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-full flex items-center justify-center space-x-2 text-emerald-400 font-sans text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Thank you! We&apos;ll reach out shortly.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter organizational email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-sm text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all font-sans"
                  />
                  <Button type="submit" size="lg" className="bg-white text-primary hover:bg-violet-50 font-semibold rounded-full px-6 py-3 h-auto shadow-sm flex items-center justify-center space-x-1.5 shrink-0">
                    <span>Contact Sales</span>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Large brand watermark (finflow) at the bottom */}
          <div className="text-center select-none pointer-events-none mt-16">
            <h3 className="font-display font-extrabold text-6xl sm:text-8xl md:text-9xl tracking-tighter opacity-15 text-white/70 leading-none">
              FINFLOW
            </h3>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pb-16 border-b border-zinc-800">
          {footerLinks.map((column) => (
            <div key={column.title} className="flex flex-col space-y-4">
              <h4 className="font-display font-bold text-sm tracking-wider uppercase text-zinc-400">
                {column.title}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 font-sans font-light"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright and Socials */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500 font-sans font-light">
          <div>
            © {new Date().getFullYear()} FinFlow, Inc. All rights reserved.
          </div>

          <div className="flex space-x-6">
            <Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-white transition-colors">Security</Link>
          </div>

          <div className="flex gap-4">
            <Link href="/" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </Link>
            <Link href="/" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            </Link>
            <Link href="/" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 01-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 01-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 011.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12L10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
            </Link>
            <Link href="/" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="YouTube">
              <FaYoutube className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
