"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KairosMark } from "@/components/icons/KairosMark";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (authError) throw authError;

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again or use a different browser.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div
        className="w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-8"
        style={{ boxShadow: "var(--shadow-3)" }}
      >
        <div className="flex items-center gap-3 mb-8">
          <KairosMark size={28} className="rounded-r3" />
          <span className="font-display text-18 font-medium tracking-tight" style={{ color: "#f0f0ee" }}>
            Kairos
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
                name="name"
                type="text"
                placeholder="Your name"
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
                name="email"
                type="email"
                placeholder="you@example.com"
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
                name="password"
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
                name="confirm"
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

