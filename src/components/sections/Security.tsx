import { GlassCard } from "@/components/ui/GlassCard";

const items = [
  { title: "Invite gate", body: "Env-static invite code, validated in constant time. No dynamic invite generation." },
  { title: "Encrypted 0G Storage", body: "AES-256-GCM with per-record IVs. Plaintext never leaves the server." },
  { title: "No deletes", body: "The agent cannot delete clients, chats, or summaries. No destructive operations exist." },
  { title: "No key retrieval", body: "Storage keys, encryption keys, and the bot token are never exposed to the agent or users." },
  { title: "No local-data answers", body: "Runtime answers read from 0G. Seed data is seed-only." }
];

export function Security() {
  return (
    <section id="security" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">Security</h2>
        <p className="mb-12 max-w-2xl text-white/65">
          Boundaries enforced at the code layer, not just the prompt.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <GlassCard key={i.title}>
              <div className="mb-2 text-lg font-medium">{i.title}</div>
              <div className="text-sm text-white/65">{i.body}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
