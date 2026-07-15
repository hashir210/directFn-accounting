"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Menu, X, Activity } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Products", href: "#products" },
    { name: "Industries", href: "#industries" },
    { name: "Solutions", href: "#solutions" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-4 px-4 sm:px-6 md:px-8">
      {/* Container holding the glass navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-full px-4 sm:px-6 md:px-8 shadow-xs transition-all duration-300">
        
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Fin<span className="text-primary">Flow</span>
          </span>
        </Link>

        {/* Desktop Navigation Links - Pill Shape */}
        <nav className="hidden md:flex items-center bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40 rounded-full px-1 py-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary rounded-full hover:bg-white dark:hover:bg-zinc-950 hover:shadow-xs transition-all duration-200"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={buttonVariants({
              size: "lg",
              className: "rounded-full px-6 font-medium shadow-xs"
            })}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground focus:outline-none p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-zinc-100 dark:border-zinc-900"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={buttonVariants({
                  className: "w-full rounded-full py-3 shadow-xs"
                })}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
