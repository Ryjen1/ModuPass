"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

export default function Navigation() {
  const [mounted, setMounted] = useState(false);
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const activeWallet = wallets[0];
  const displayAddress = activeWallet?.address || user?.wallet?.address;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ModuPass</span>
          </Link>

          <nav className="flex items-center gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition">How it works</a>
            <a href="#usecases" className="text-muted-foreground hover:text-foreground transition">Use cases</a>
            <Link href="/events" className="text-muted-foreground hover:text-foreground transition">Events</Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition">Dashboard</Link>

            {!mounted ? (
              <Button
                disabled
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
              >
                <Wallet className="w-4 h-4" />
                Loading...
              </Button>
            ) : authenticated && displayAddress ? (
              <div className="flex items-center gap-3">
                <Link href="/app" className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition">
                  Launch App
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium">
                  <Wallet className="w-4 h-4" />
                  {formatAddress(displayAddress)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => login()}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}