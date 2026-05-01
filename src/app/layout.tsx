import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiwin — Digital Twin for Company Operations",
  description:
    "Invite-gated Digital Twin demo powered by 0G Compute and encrypted 0G testnet Storage."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg bg-radial-fade antialiased">
        {children}
      </body>
    </html>
  );
}
