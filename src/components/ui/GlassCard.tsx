import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Glassmorphism card — blurred translucent surface with a subtle ring.
 * Used throughout sections for feature tiles, FAQ blocks, etc.
 */
export function GlassCard({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_8px_40px_-12px_rgba(124,92,255,0.25)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
