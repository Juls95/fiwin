import { LinkButton } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent2" />
          MVP demo · 0G testnet
        </div>
        <h1 className="mb-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          A Digital Twin for your
          <br />
          <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
            company operations.
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70">
          Invite-gated Telegram agent. 0G Compute for inference. Encrypted 0G testnet Storage
          as the only source of truth for client data, chat history, and memory summaries.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/connect" size="lg">
            Enter invite code
          </LinkButton>
          <LinkButton href="#how" variant="ghost" size="lg">
            How it works
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
