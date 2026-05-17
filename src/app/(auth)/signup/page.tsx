"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const response = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    console.log("Supabase signUp response:", response);

    if (response.error) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div
        className="w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-8"
        style={{ boxShadow: "var(--shadow-3)" }}
      >
        <div className="flex items-center gap-3 mb-8">
          <CrestLogo />
          <span className="font-display text-18 font-semibold text-text-primary tracking-tight">
            Crest
          </span>
        </div>

        <h1 className="font-display text-24 font-semibold text-text-primary tracking-tight mb-1">
          Create your account
        </h1>
        <p className="text-13 text-text-secondary mb-6">
          Start building your best self.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
              Name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-r3 border border-border bg-bg-base pl-9 pr-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-r3 border border-border bg-bg-base pl-9 pr-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-r3 border border-border bg-bg-base pl-9 pr-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
              Confirm password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-r3 border border-border bg-bg-base pl-9 pr-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-r3 px-3 py-2.5 text-13 text-danger bg-[var(--color-danger-soft)] border border-danger/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-r3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-13 py-2.5 transition-colors mt-1"
            style={{ boxShadow: "var(--shadow-accent)" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-13 text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function CrestLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#16161E" />
      <path
        d="M14 42 L32 18 L50 42"
        stroke="#8B83FF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 48 L32 32 L44 48"
        stroke="#E8E6E0"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}
