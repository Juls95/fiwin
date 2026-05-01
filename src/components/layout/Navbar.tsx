import { LinkButton } from "@/components/ui/Button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span>Fiwin</span>
        </a>
        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#security" className="hover:text-white">Security</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
        <LinkButton href="/connect" size="md">
          Connect →
        </LinkButton>
      </nav>
    </header>
  );
}
