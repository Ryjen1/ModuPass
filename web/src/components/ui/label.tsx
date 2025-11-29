import * as React from "react";

export function Label({ htmlFor, className = "", children }: { htmlFor?: string; className?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium text-foreground ${className}`}>
      {children}
    </label>
  );
}
