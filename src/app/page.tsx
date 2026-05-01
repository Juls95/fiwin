/**
 * Root landing page — STUB.
 * The full section-based landing page is built in Phase 11
 * (Hero, HowItWorks, Features, Security, FAQ, Navbar, Footer).
 * This stub exists so /connect's "← back" link and the app's root route
 * resolve cleanly while earlier phases are verified end-to-end.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="mb-4 text-4xl font-semibold tracking-tight">Fiwin</h1>
      <p className="mb-8 text-white/70">
        Digital Twin for company operations. Invite-gated Telegram demo,
        powered by 0G Compute and encrypted 0G testnet Storage.
      </p>
      <a
        href="/connect"
        className="inline-block w-fit rounded-xl bg-accent px-5 py-3 font-medium text-white hover:bg-accent/90"
      >
        Enter invite code →
      </a>
    </main>
  );
}
