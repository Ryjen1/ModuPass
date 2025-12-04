"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto px-6 pt-16 pb-24 md:pt-20 md:pb-32 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Built on KRNL infrastructure
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl mb-8 text-foreground font-bold tracking-tight leading-[1.1]">
            Verifiable attendance<br className="hidden sm:block" /> credentials for Web3
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Issue cryptographically verifiable proof of attendance. Cross-chain, modular, and built for communities that value authenticity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/events/create"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3.5 text-base font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/25"
            >
              Create Event
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/events/verify"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3.5 text-base font-medium hover:bg-accent hover:text-accent-foreground transition"
            >
              Verify Attendance
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
