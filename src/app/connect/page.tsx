"use client";

import { useState } from "react";

interface Instructions {
  botUsername: string;
  botDeepLink: string;
  steps: string[];
  notes: string[];
}

interface VerifyResponse {
  ok: boolean;
  instructions?: Instructions;
  error?: string;
}

export default function ConnectPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });
      const json = (await res.json()) as VerifyResponse;
      setResult(json);
    } catch {
      setResult({ ok: false, error: "network_error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <a href="/" className="mb-8 text-sm text-white/60 hover:text-white">
        ← back
      </a>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Connect</h1>
      <p className="mb-8 text-white/70">
        Enter your invite code to receive Telegram bot instructions.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          autoComplete="off"
          inputMode="text"
          placeholder="invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none backdrop-blur focus:border-accent"
          required
          minLength={4}
          maxLength={128}
        />
        <button
          type="submit"
          disabled={loading || code.trim().length < 4}
          className="rounded-xl bg-accent px-4 py-3 font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Checking…" : "Verify invite"}
        </button>
      </form>

      {result && !result.ok && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {result.error === "invalid_code"
            ? "That invite code is not valid."
            : "Something went wrong. Please try again."}
        </div>
      )}

      {result?.ok && result.instructions && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="mb-4 text-lg font-medium">You're in. Next steps:</h2>
          <ol className="list-decimal space-y-2 pl-5 text-white/85">
            {result.instructions.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <a
            href={result.instructions.botDeepLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-xl bg-accent2 px-4 py-2 font-medium text-bg hover:bg-accent2/90"
          >
            Open {result.instructions.botUsername}
          </a>
          <ul className="mt-6 space-y-1 text-sm text-white/60">
            {result.instructions.notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
