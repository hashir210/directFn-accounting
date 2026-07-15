"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function FAQ() {
  const faqs = [
    {
      id: "faq-1",
      question: "How does FinFlow handle fund accounting and grant allocation?",
      answer: "FinFlow supports complete double-entry general ledgers with cost center tagging. When a donation or grant is received, you can assign it to specific restricted/unrestricted buckets. The system tracks spending against these buckets in real-time, preventing overspending and ensuring audit readiness."
    },
    {
      id: "faq-2",
      question: "Is FinFlow compliant with GAAP and FASB standards?",
      answer: "Yes, absolutely. FinFlow is built from the ground up to comply with non-profit accounting standards, including FASB ASC 958 (non-profit financial statements) and GAAP. Generate statements of financial position, activities, and functional expenses in one click."
    },
    {
      id: "faq-3",
      question: "Can we integrate FinFlow with existing student information systems (SIS)?",
      answer: "Yes. FinFlow provides open APIs and pre-built connectors for major K-12 Student Information Systems and donor databases. This lets you import tuition billing data, class rosters, and donor CRM histories without manual CSV spreadsheets."
    },
    {
      id: "faq-4",
      question: "How secure is our donors' personal and credit card data?",
      answer: "Security is our highest priority. FinFlow is a PCI-DSS Level 1 compliant platform. All payment details are fully tokenized and encrypted in transit and at rest. We never store credit card numbers on our local servers."
    },
    {
      id: "faq-5",
      question: "What level of support do you offer for finance directors?",
      answer: "Every subscription includes onboarding assistance and 24/7 technical support. Enterprise plans also include a dedicated account manager with non-profit certified accounting expertise to guide your audit and ledger migrations."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white dark:bg-zinc-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-primary font-bold text-xs uppercase tracking-widest mb-3 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 mr-2" />
            <span>Support & Help</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-sans font-light max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our ledger structure, data security, and compliance.
          </p>
        </div>

        {/* Accordion List */}
        <div className="bg-zinc-50 dark:bg-zinc-900/45 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 sm:p-8">
          <Accordion className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
                <AccordionTrigger className="text-zinc-900 dark:text-zinc-100 hover:text-primary dark:hover:text-primary text-base font-semibold font-display py-4 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-600 dark:text-zinc-400 font-sans font-light leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </section>
  );
}
