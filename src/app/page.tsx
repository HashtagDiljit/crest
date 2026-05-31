import Link from "next/link";
import {
  Dumbbell, Heart, Target, Smile, PenLine, Trophy,
  Flame, Zap, Star, Lock, ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-border max-w-[1200px] w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <CrestLogo />
          <span className="font-display text-18 font-semibold text-text-primary tracking-tight">Crest</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-13 font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link href="/signup" className="text-13 font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-r3 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 relative overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(108,99,255,0.12), transparent)" }}
        />
        <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border text-12 font-medium text-text-secondary"
            style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-soft)" }}
          >
            <Zap size={12} className="text-accent" />
            Personal life OS — built for people serious about progress
          </div>

          <h1 className="font-display text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-semibold tracking-tight leading-[1.05] text-text-primary">
            Your life.{" "}
            <span style={{ background: "linear-gradient(135deg, var(--color-accent), #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Tracked.
            </span>{" "}
            Improved.{" "}
            <span style={{ background: "linear-gradient(135deg, #10B981, #0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Owned.
            </span>
          </h1>

          <p className="text-15 md:text-18 text-text-secondary max-w-xl leading-relaxed">
            Crest brings workouts, health, habits, mood, journaling, and goals into one unified dashboard — with built-in gamification to keep you coming back.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-6 py-3 rounded-r4 bg-accent hover:bg-accent-hover text-white font-semibold text-15 transition-colors"
              style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 10px 30px rgba(108,99,255,0.30)" }}
            >
              Get started free
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-r4 border border-border bg-bg-elevated hover:bg-bg-overlay text-text-primary font-medium text-15 transition-colors"
            >
              Sign in
            </Link>
          </div>

          <p className="text-12 text-text-disabled mt-1">No credit card required · Your data stays private</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 md:py-24 max-w-[1200px] mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-12 font-semibold uppercase tracking-widest text-accent mb-3">Everything in one place</p>
          <h2 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
            Six pillars of a well-tracked life
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 group hover:border-border-strong transition-colors"
            >
              <div
                className="w-11 h-11 rounded-r4 flex items-center justify-center flex-shrink-0"
                style={{ background: `${f.color}18` }}
              >
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <div>
                <p className="font-display text-16 font-semibold text-text-primary mb-1">{f.title}</p>
                <p className="text-13 text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification */}
      <section className="px-6 py-20 md:py-24 border-y border-border" style={{ background: "var(--color-bg-inset)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-12 font-semibold uppercase tracking-widest text-accent mb-3">Stay motivated</p>
            <h2 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
              Progress that feels rewarding
            </h2>
            <p className="text-15 text-text-secondary mt-3 max-w-lg mx-auto">
              Every action earns XP. Streaks compound. Achievements unlock. Crest turns your routines into a game you want to win.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* XP card */}
            <div className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-pill bg-accent flex items-center justify-center font-mono text-14 font-bold text-white">12</div>
                <div>
                  <p className="text-14 font-semibold text-text-primary">Level 12</p>
                  <p className="text-11 text-text-muted">Expert</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-13 font-bold text-text-primary">5,840 XP</p>
                  <p className="text-11 text-text-muted">160 to next level</p>
                </div>
              </div>
              <div className="h-2 rounded-pill overflow-hidden" style={{ background: "var(--color-xp-track)" }}>
                <div className="h-full rounded-pill w-[97%]" style={{ background: "linear-gradient(90deg, var(--color-accent), #EC4899)" }} />
              </div>
              <p className="text-12 text-text-muted">Earn XP every time you log a workout, habit, or journal entry.</p>
            </div>

            {/* Streak card */}
            <div className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-pill" style={{ background: "rgba(255,138,61,0.10)", border: "1px solid rgba(255,138,61,0.25)" }}>
                  <Flame size={18} className="text-streak" />
                  <span className="font-mono text-20 font-bold text-text-primary">47</span>
                </div>
                <div>
                  <p className="text-14 font-semibold text-text-primary">Day streak</p>
                  <p className="text-11 text-text-muted">Best: 47 days</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-r1"
                    style={{ background: i < 12 ? "var(--color-streak)" : "var(--color-bg-elevated)", opacity: i < 12 ? (0.5 + i * 0.04) : 1 }}
                  />
                ))}
              </div>
              <p className="text-12 text-text-muted">Log at least one activity each day to keep your streak alive.</p>
            </div>

            {/* Achievements card */}
            <div className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4">
              <p className="text-14 font-semibold text-text-primary flex items-center gap-2">
                <Trophy size={16} className="text-accent" />
                Recent achievements
              </p>
              <div className="flex flex-col gap-2">
                {ACHIEVEMENTS.map((a) => (
                  <div key={a.name} className="flex items-center gap-3 p-2.5 rounded-r3" style={{ background: `${a.color}10` }}>
                    <span className="text-18">{a.icon}</span>
                    <div className="min-w-0">
                      <p className="text-12 font-semibold text-text-primary">{a.name}</p>
                      <p className="text-11 text-text-muted">+{a.xp} XP</p>
                    </div>
                    <Star size={12} className="ml-auto flex-shrink-0" style={{ color: a.color }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-6 py-20 md:py-24 max-w-[1200px] mx-auto w-full">
        <div className="rounded-r5 border border-border bg-bg-surface p-8 md:p-12 flex flex-col md:flex-row items-start gap-8">
          <div className="w-14 h-14 rounded-r5 bg-bg-elevated flex items-center justify-center flex-shrink-0">
            <Lock size={24} className="text-accent" />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-22 md:text-24 font-semibold text-text-primary tracking-tight">
              Your data stays yours
            </h2>
            <p className="text-14 text-text-secondary leading-relaxed max-w-2xl">
              Crest stores all your data securely in your own Supabase database. Nothing is sold, shared, or processed for advertising. You can export everything at any time from Settings, or delete your account with one click. Your health data is personal — we treat it that way.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {["End-to-end auth", "Exportable data", "Never sold", "Delete anytime"].map((item) => (
                <span key={item} className="text-12 font-medium text-text-secondary px-3 py-1.5 rounded-pill border border-border bg-bg-elevated">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 py-16 text-center border-t border-border" style={{ background: "var(--color-bg-inset)" }}>
        <div className="max-w-xl mx-auto flex flex-col items-center gap-5">
          <CrestLogo size={48} />
          <h2 className="font-display text-22 md:text-28 font-semibold text-text-primary tracking-tight">
            Ready to take control?
          </h2>
          <Link
            href="/signup"
            className="flex items-center gap-2 px-8 py-3.5 rounded-r4 bg-accent hover:bg-accent-hover text-white font-semibold text-15 transition-colors"
            style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 10px 30px rgba(108,99,255,0.30)" }}
          >
            Create your free account
            <ChevronRight size={16} />
          </Link>
          <p className="text-13 text-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">Sign in</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CrestLogo size={20} />
            <span className="font-display text-14 font-semibold text-text-secondary">Crest</span>
            <span className="text-13 text-text-disabled ml-1">— Your personal life OS</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-13 text-text-muted hover:text-text-secondary transition-colors">Sign in</Link>
            <Link href="/signup" className="text-13 text-accent hover:text-accent-hover transition-colors">Get started free</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: "Workouts",
    icon: Dumbbell,
    color: "var(--color-accent)",
    desc: "Log sessions, build templates, track personal records, and see progressive overload suggestions.",
  },
  {
    title: "Health",
    icon: Heart,
    color: "#F43F5E",
    desc: "Monitor sleep, body measurements, HRV, resting heart rate, and daily readiness scores.",
  },
  {
    title: "Habits",
    icon: Target,
    color: "#10B981",
    desc: "Build routines with customisable habits, streak tracking, and a 6-month heatmap view.",
  },
  {
    title: "Mood",
    icon: Smile,
    color: "#F59E0B",
    desc: "Score your daily mood, add notes, and discover what lifestyle factors correlate with feeling good.",
  },
  {
    title: "Journal",
    icon: PenLine,
    color: "#0EA5E9",
    desc: "Write daily entries with tag support, weekly reflection prompts, and searchable history.",
  },
  {
    title: "Goals",
    icon: Trophy,
    color: "#A855F7",
    desc: "Set long-term goals with milestones, progress tracking, and a completion history.",
  },
];

const ACHIEVEMENTS = [
  { name: "First workout", icon: "🏋️", color: "#A855F7", xp: 50 },
  { name: "7-day streak", icon: "🔥", color: "#FF8A3D", xp: 100 },
  { name: "Iron will", icon: "🥇", color: "#FFD700", xp: 250 },
];

function CrestLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" style={{ fill: "var(--color-bg-elevated)" }} />
      <path d="M14 42 L32 18 L50 42" style={{ stroke: "var(--color-accent)" }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 48 L32 32 L44 48" style={{ stroke: "var(--color-text-primary)" }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}
