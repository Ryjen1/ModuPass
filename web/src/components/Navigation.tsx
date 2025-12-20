import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Menu, X } from "lucide-react";

export default function Navigation() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const NavLinks = ({ className = "", onClick = () => { } }) => (
    <>
      <a href="/#features" onClick={onClick} className={`text-muted-foreground hover:text-foreground transition ${className}`}>Features</a>
      <a href="/#how" onClick={onClick} className={`text-muted-foreground hover:text-foreground transition ${className}`}>How it works</a>
      <a href="/#usecases" onClick={onClick} className={`text-muted-foreground hover:text-foreground transition ${className}`}>Use cases</a>
      <Link href="/events" onClick={onClick} className={`text-muted-foreground hover:text-foreground transition ${className}`}>Events</Link>
      <Link href="/dashboard" onClick={onClick} className={`text-muted-foreground hover:text-foreground transition ${className}`}>Dashboard</Link>
    </>
  );

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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <NavLinks />

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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background z-50 p-6 flex flex-col gap-6 animate-in slide-in-from-top-5">
          <NavLinks className="text-lg py-2 border-b border-border/50" onClick={() => setIsMenuOpen(false)} />

          <div className="mt-4">
            {!mounted ? (
              <Button disabled className="w-full">Loading...</Button>
            ) : authenticated && displayAddress ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center gap-2 px-3 py-3 rounded-md bg-accent text-accent-foreground font-medium">
                  <Wallet className="w-4 h-4" />
                  {formatAddress(displayAddress)}
                </div>
                <Button onClick={() => { logout(); setIsMenuOpen(false); }} variant="outline" className="w-full">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={() => { login(); setIsMenuOpen(false); }} className="w-full">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}