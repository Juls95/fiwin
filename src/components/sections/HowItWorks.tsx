import { GlassCard } from "@/components/ui/GlassCard";

const steps = [
  {
    n: "01",
    title: "Enter invite code",
    body: "Visit /connect and paste the static invite code from the project team."
  },
  {
    n: "02",
    title: "Open the Telegram bot",
    body: "You'll receive a deep link to the configured Fiwin demo bot."
  },
  {
    n: "03",
    title: "Send /start <inviteCode>",
    body: "Your chat is bound to the shared demo workspace — encrypted on 0G."
  },
  {
    n: "04",
    title: "Ask about clients",
    body: "List, get, create, update, or summarize clients. Recall today's conversation."
  }
];

export function HowItWorks() {
  return (
    <section id="how" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
        <p className="mb-12 max-w-2xl text-white/65">
          Four steps from landing page to operating a shared demo database over Telegram.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <GlassCard key={s.n}>
              <div className="mb-3 text-xs font-medium text-accent2">{s.n}</div>
              <div className="mb-2 text-lg font-medium">{s.title}</div>
              <div className="text-sm text-white/60">{s.body}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
