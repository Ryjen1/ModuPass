"use client";

import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import { Card } from "@/components/ui/card";
import { Shield, Globe, Code, Github, ArrowRight, Users, Zap, BookOpen, Calendar } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-12 md:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Built for trust and transparency</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Every credential is cryptographically secured and verifiable across chains
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition border-border/50">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="heading-sm mb-3">Cryptographically verified</h3>
              <p className="text-muted-foreground">
                Every attendance record is processed through KRNL's kernel architecture, ensuring immutable proof that cannot be forged.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-lg transition border-border/50">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="heading-sm mb-3">Cross-chain native</h3>
              <p className="text-muted-foreground">
                Issue credentials on any blockchain. KRNL's decentralized orchestration handles verification across chains seamlessly.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-lg transition border-border/50">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="heading-sm mb-3">Open & modular</h3>
              <p className="text-muted-foreground">
                Built with reusable templates and modules. Deploy for DAOs, hackathons, learning platforms, or community events.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">How it works</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to issue verifiable credentials
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="heading-sm mb-3">Create your event</h3>
                <p className="text-muted-foreground body-md">
                  Set up your event details and configure KRNL kernel verification parameters. Choose which blockchain to issue credentials on.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="heading-sm mb-3">Attendees register</h3>
                <p className="text-muted-foreground body-md">
                  Participants connect their wallet and register for your event. Their wallet address is recorded off-chain until verification.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="heading-sm mb-3">Issue credentials</h3>
                <p className="text-muted-foreground body-md">
                  After the event, issue verifiable credentials. The KRNL kernel validates attendance and mints on-chain proof to attendees' wallets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="usecases" className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Built for Web3 communities</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Verifiable credentials for every type of community event
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="heading-sm mb-3">DAOs & Governance</h3>
              <p className="text-muted-foreground">
                Issue attendance proof for governance calls, working group meetings, and community events. Build reputation systems based on verifiable participation.
              </p>
            </Card>

            <Card className="p-8 border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="heading-sm mb-3">Hackathons</h3>
              <p className="text-muted-foreground">
                Verify participant attendance, workshop completion, and project submissions. Issue credentials that prove builders' experience and contributions.
              </p>
            </Card>

            <Card className="p-8 border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="heading-sm mb-3">Learning platforms</h3>
              <p className="text-muted-foreground">
                Create verifiable certificates for course completion, workshop attendance, and skill validation. Build learner profiles with trustless credentials.
              </p>
            </Card>

            <Card className="p-8 border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="heading-sm mb-3">Conferences & meetups</h3>
              <p className="text-muted-foreground">
                Replace traditional badges with on-chain credentials. Enable networking based on verified attendance at specific events or sessions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-lg mb-6">Open source & community driven</h2>
            <p className="body-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Fork the repository, customize the kernels, and deploy your own instance. Join the community building the future of verifiable credentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3.5 text-base font-medium hover:opacity-90 transition"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3.5 text-base font-medium hover:bg-accent hover:text-accent-foreground transition"
              >
                Read documentation
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-primary-foreground" />
              </div>
              <span className="font-semibold">ModuPass</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with KRNL • Open source • Q4 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}