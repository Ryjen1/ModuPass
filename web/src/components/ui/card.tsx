import * as React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card text-card-foreground shadow ${className}`}>
      {children}
    </div>
  );
}
