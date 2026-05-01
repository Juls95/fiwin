import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90",
  secondary: "bg-accent2 text-bg hover:bg-accent2/90",
  ghost: "border border-white/15 bg-white/5 text-white hover:bg-white/10 backdrop-blur"
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base"
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
