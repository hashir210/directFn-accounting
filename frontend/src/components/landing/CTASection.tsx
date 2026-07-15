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
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Security</Link>
          </div>

          {/* Social icons */}
          <div className="flex space-x-4 text-zinc-400">
            <Link href="#" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="Twitter">
              <FaTwitter className="h-4 w-4" />
            </Link>
            <Link href="#" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="GitHub">
              <FaGithub className="h-4 w-4" />
            </Link>
            <Link href="#" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="LinkedIn">
              <FaLinkedin className="h-4 w-4" />
            </Link>
            <Link href="#" className="hover:text-white hover:scale-115 transition-all p-1" aria-label="YouTube">
              <FaYoutube className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
