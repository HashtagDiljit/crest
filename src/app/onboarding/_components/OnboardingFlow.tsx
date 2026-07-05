"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Check, ChevronRight, Plus, X } from "lucide-react";
import {
  saveOnboardingStats,
  saveOnboardingGoals,
  saveOnboardingHabits,
  saveOnboardingWorkoutSplit,
  completeOnboarding,
  trackOnboardingStep,
} from "../actions";

const TOTAL_STEPS = 6;

const SUGGESTED_HABITS = [
  "Read 20 min",
  "8hrs sleep",
  "3L water",
  "Daily workout",
  "Journal",
  "No screens after 22:00",
];

const GOAL_CATEGORIES = [
  "fitness",
  "health",
  "nutrition",
  "habits",
  "mental",
  "general",
];

// ─── progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="w-full h-1 bg-bg-elevated rounded-pill overflow-hidden">
      <div
        className="h-full bg-accent rounded-pill transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── shell ────────────────────────────────────────────────────────────────────

function Shell({
  children,
  step,
  onBack,
}: {
  children: React.ReactNode;
  step: number;
  onBack?: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <ProgressBar step={step} />
          <span className="font-mono text-11 text-text-muted">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        <div
          className="rounded-r5 border border-border bg-bg-surface p-7 flex flex-col gap-6"
          style={{ boxShadow: "var(--shadow-3)" }}
        >
          {children}
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-13 text-text-muted hover:text-text-secondary transition-colors self-start"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 rounded-r3 text-13 font-semibold transition-colors disabled:opacity-50 ${
        variant === "primary"
          ? "bg-accent hover:bg-accent-hover text-white"
          : "border border-border text-text-secondary hover:bg-bg-elevated"
      }`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required={required}
        className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

// ─── step 1: welcome ──────────────────────────────────────────────────────────

function Step1({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <Shell step={1}>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-28 font-semibold text-text-primary tracking-tight">
          Welcome to Kairos, {firstName} 👋
        </h1>
        <p className="text-15 text-text-secondary">
          Kairos helps you track workouts, sleep, habits, mood, and goals — all
          in one place. XP and streaks keep you accountable.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-13 text-text-muted">
        {[
          "Log workouts with progressive overload hints",
          "Track sleep, mood, and daily habits",
          "Set goals and watch your progress",
          "Earn XP and achievements as you go",
        ].map((line) => (
          <div key={line} className="flex items-start gap-2">
            <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
            <span>{line}</span>
          </div>
        ))}
      </div>
      <Btn onClick={onNext}>
        Let&apos;s set you up in 5 steps <ChevronRight size={15} className="inline ml-1" />
      </Btn>
    </Shell>
  );
}

// ─── step 2: stats ────────────────────────────────────────────────────────────

function Step2({ onNext, onSkip, onBack }: { onNext: () => void; onSkip: () => void; onBack: () => void }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    await saveOnboardingStats(new FormData(e.currentTarget));
    setSaving(false);
    onNext();
  }

  return (
    <Shell step={2} onBack={onBack}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-22 font-semibold text-text-primary">Your stats <span className="text-13 font-normal text-text-muted ml-1">(optional)</span></h2>
        <p className="text-13 text-text-secondary">
          Used for BMI, body fat estimates, and personalised targets. You can fill this in later from Health settings.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Height (cm)" name="height_cm" type="number" placeholder="175" />
          <Input label="Weight (kg)" name="weight_kg" type="number" placeholder="75" />
        </div>
        <Input label="Date of birth" name="date_of_birth" type="date" />
        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
            Gender
          </label>
          <select
            name="gender"
            className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
            Training experience
          </label>
          <div className="flex gap-2">
            {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
              <label
                key={lvl}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-r3 border border-border text-13 text-text-secondary cursor-pointer hover:bg-bg-elevated transition-colors has-[:checked]:bg-accent-soft has-[:checked]:border-accent-ring has-[:checked]:text-accent"
              >
                <input
                  type="radio"
                  name="training_experience"
                  value={lvl.toLowerCase()}
                  className="sr-only"
                  defaultChecked={lvl === "Beginner"}
                />
                {lvl}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
          <button type="button" onClick={onSkip} className="w-full py-2.5 rounded-r3 border border-border text-13 text-text-secondary hover:bg-bg-elevated transition-colors">
            Skip for now
          </button>
        </div>
      </form>
    </Shell>
  );
}

// ─── step 3: goals ────────────────────────────────────────────────────────────

interface GoalDraft {
  title: string;
  category: string;
  target_date: string;
}

function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [goals, setGoals] = useState<GoalDraft[]>([
    { title: "", category: "fitness", target_date: "" },
  ]);
  const [saving, setSaving] = useState(false);

  function addGoal() {
    if (goals.length < 3)
      setGoals((g) => [...g, { title: "", category: "fitness", target_date: "" }]);
  }

  function removeGoal(i: number) {
    setGoals((g) => g.filter((_, idx) => idx !== i));
  }

  function updateGoal(i: number, field: keyof GoalDraft, val: string) {
    setGoals((g) => g.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  async function handleNext() {
    setSaving(true);
    await saveOnboardingGoals(
      goals.map((g) => ({
        title: g.title,
        category: g.category,
        target_date: g.target_date || null,
      }))
    );
    setSaving(false);
    onNext();
  }

  return (
    <Shell step={3} onBack={onBack}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-22 font-semibold text-text-primary">Your goals</h2>
        <p className="text-13 text-text-secondary">
          Add up to 3 goals to track. You can always add more later.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {goals.map((goal, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-4 rounded-r4 border border-border bg-bg-elevated"
          >
            <div className="flex items-center justify-between">
              <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
                Goal {i + 1}
              </span>
              {goals.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  className="text-text-muted hover:text-danger transition-colors"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
            <input
              type="text"
              placeholder="e.g. Run a 5K in under 25 min"
              value={goal.title}
              onChange={(e) => updateGoal(i, "title", e.target.value)}
              className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
            />
            <div className="flex gap-2">
              <select
                value={goal.category}
                onChange={(e) => updateGoal(i, "category", e.target.value)}
                className="flex-1 rounded-r3 border border-border bg-bg-base px-2 py-2 text-12 text-text-secondary outline-none focus:border-accent transition-colors"
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={goal.target_date}
                onChange={(e) => updateGoal(i, "target_date", e.target.value)}
                className="flex-1 rounded-r3 border border-border bg-bg-base px-2 py-2 text-12 text-text-secondary outline-none focus:border-accent transition-colors"
                placeholder="Target date (optional)"
              />
            </div>
          </div>
        ))}

        {goals.length < 3 && (
          <button
            type="button"
            onClick={addGoal}
            className="flex items-center gap-1.5 text-13 text-accent hover:text-accent-hover transition-colors"
          >
            <Plus size={14} /> Add another goal
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Btn onClick={handleNext} disabled={saving}>
          {saving ? "Saving…" : "Continue"}
        </Btn>
        <Btn onClick={onNext} variant="ghost">
          Skip for now
        </Btn>
      </div>
    </Shell>
  );
}

// ─── step 4: habits ───────────────────────────────────────────────────────────

function Step4({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(name: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function handleNext() {
    setSaving(true);
    const habits = Array.from(selected);
    if (custom.trim()) habits.push(custom.trim());
    await saveOnboardingHabits(habits);
    setSaving(false);
    onNext();
  }

  return (
    <Shell step={4} onBack={onBack}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-22 font-semibold text-text-primary">Your habits</h2>
        <p className="text-13 text-text-secondary">
          Pick habits you want to track daily. Tick off completed items to build your streak.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SUGGESTED_HABITS.map((name) => {
          const on = selected.has(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-r3 border text-13 text-left transition-colors ${
                on
                  ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-text-primary"
                  : "border-border text-text-secondary hover:bg-bg-elevated"
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                  on ? "bg-accent border-accent" : "border-border"
                }`}
              >
                {on && <Check size={10} className="text-white" />}
              </div>
              {name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          Add custom habit
        </label>
        <input
          type="text"
          placeholder="e.g. Cold shower"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Btn onClick={handleNext} disabled={saving}>
          {saving ? "Saving…" : "Continue"}
        </Btn>
        <Btn onClick={onNext} variant="ghost">
          Skip for now
        </Btn>
      </div>
    </Shell>
  );
}

// ─── step 5: workout split ────────────────────────────────────────────────────

const SPLITS = [
  { id: "upper_lower", label: "Upper / Lower" },
  { id: "ppl", label: "Push / Pull / Legs" },
  { id: "full_body", label: "Full body" },
  { id: "custom", label: "Custom" },
];

function Step5({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [days, setDays] = useState(4);
  const [split, setSplit] = useState("upper_lower");
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    await saveOnboardingWorkoutSplit(days, split);
    setSaving(false);
    onNext();
  }

  return (
    <Shell step={5} onBack={onBack}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-22 font-semibold text-text-primary">Your workout split</h2>
        <p className="text-13 text-text-secondary">
          We&apos;ll set your weekly target and optionally pre-load templates.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
            Days per week
          </label>
          <div className="flex gap-2">
            {[3, 4, 5, 6].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`flex-1 py-2.5 rounded-r3 border text-13 font-semibold transition-colors ${
                  days === d
                    ? "bg-accent text-white border-accent"
                    : "border-border text-text-secondary hover:bg-bg-elevated"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
            Split type
          </label>
          <div className="flex flex-col gap-1.5">
            {SPLITS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSplit(s.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-r3 border text-13 text-left transition-colors ${
                  split === s.id
                    ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-text-primary"
                    : "border-border text-text-secondary hover:bg-bg-elevated"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-pill flex-shrink-0 border-2 transition-colors ${
                    split === s.id ? "border-accent bg-accent" : "border-border"
                  }`}
                />
                {s.label}
                {s.id === "upper_lower" && days === 4 ? (
                  <span className="ml-auto text-11 text-accent">Templates pre-loaded</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Btn onClick={handleNext} disabled={saving}>
          {saving ? "Setting up…" : "Continue"}
        </Btn>
        <Btn onClick={onNext} variant="ghost">
          Skip for now
        </Btn>
      </div>
    </Shell>
  );
}

// ─── step 6: all set ──────────────────────────────────────────────────────────

function Step6({
  firstName,
  completedSteps,
}: {
  firstName: string;
  completedSteps: Set<number>;
}) {
  const [loading, setLoading] = useState(false);

  const summary = [
    { step: 2, label: "Stats saved" },
    { step: 3, label: "Goals created" },
    { step: 4, label: "Habits set up" },
    { step: 5, label: "Workout split configured" },
  ];

  async function handleDone() {
    setLoading(true);
    track("onboarding_completed", { stepsCompleted: completedSteps.size });
    await completeOnboarding();
  }

  return (
    <Shell step={6}>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-28 font-semibold text-text-primary tracking-tight">
          You&apos;re all set, {firstName}!
        </h2>
        <p className="text-15 text-text-secondary">
          Here&apos;s what we set up for you:
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {summary.map(({ step, label }) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-pill flex items-center justify-center flex-shrink-0 ${
                completedSteps.has(step)
                  ? "bg-success"
                  : "bg-bg-elevated border border-border"
              }`}
            >
              {completedSteps.has(step) && (
                <Check size={12} className="text-white" />
              )}
            </div>
            <span
              className={`text-13 ${
                completedSteps.has(step) ? "text-text-primary" : "text-text-disabled"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <Btn onClick={handleDone} disabled={loading}>
        {loading ? "Loading dashboard…" : "Go to dashboard →"}
      </Btn>
    </Shell>
  );
}

// ─── main flow ────────────────────────────────────────────────────────────────

export function OnboardingFlow({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  function advance(from: number) {
    setCompletedSteps((s) => { const n = new Set(s); n.add(from); return n; });
    const next = from + 1;
    setStep(next);
    trackOnboardingStep(next).catch(() => {});
  }

  function skip(from: number) {
    const next = from + 1;
    setStep(next);
    trackOnboardingStep(next).catch(() => {});
  }

  function goBack() {
    setStep((s) => s - 1);
  }

  if (step === 1) return <Step1 firstName={firstName} onNext={() => advance(1)} />;
  if (step === 2) return <Step2 onNext={() => advance(2)} onSkip={() => skip(2)} onBack={goBack} />;
  if (step === 3) return <Step3 onNext={() => advance(3)} onBack={goBack} />;
  if (step === 4) return <Step4 onNext={() => advance(4)} onBack={goBack} />;
  if (step === 5) return <Step5 onNext={() => advance(5)} onBack={goBack} />;
  return <Step6 firstName={firstName} completedSteps={completedSteps} />;
}
