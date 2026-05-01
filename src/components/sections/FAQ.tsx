import { GlassCard } from "@/components/ui/GlassCard";

const faqs = [
  {
    q: "What is stored?",
    a: "Five seeded client records, every accepted Telegram message, and one daily summary per date. All encrypted on 0G testnet Storage."
  },
  {
    q: "How do users connect?",
    a: "Enter the invite code on /connect, open the configured Telegram bot, and send /start <inviteCode>. Many chats can bind to the same demo workspace."
  },
  {
    q: "What can the demo do?",
    a: "List, get, create, update, and summarize clients. Recall what was discussed today. That's it — six tools, no exceptions."
  },
  {
    q: "What can the demo NOT do?",
    a: "No deletes. No reminders. No key or raw-storage access. No Spanish replies. No answers from local seed data after bootstrap."
  },
  {
    q: "Where does inference run?",
    a: "0G Compute only. There is no OpenAI or Gemini fallback in the codebase."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <GlassCard key={f.q}>
              <div className="mb-1 font-medium">{f.q}</div>
              <div className="text-sm text-white/65">{f.a}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
