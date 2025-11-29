import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "lg" | "sm";
}

export function Button({ className = "", variant = "default", size = "default", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  } as const;
  const sizes = {
    default: "h-9 px-4 py-2",
    lg: "h-11 px-5 py-3",
    sm: "h-8 px-3 py-1.5 text-xs",
  } as const;

  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
