import Link from "next/link";

export const metadata = { title: "Privacy Policy — Arc" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-13 text-text-muted hover:text-text-secondary transition-colors">← Back to Arc</Link>
        </div>

        <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-13 text-text-muted mb-10">Last updated: January 2026 · Version 2026-01</p>

        <div className="flex flex-col gap-10 text-15 text-text-secondary leading-relaxed">

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Who we are</h2>
            <p>Arc is a personal health and fitness tracking application. We are committed to protecting your personal data and complying with UK GDPR and the Data Protection Act 2018. For data-related enquiries, contact us at <span className="text-text-primary">privacy@crest-weld.vercel.app</span>.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">What data we collect</h2>
            <div className="flex flex-col gap-4">
              <DataRow title="Physical health data" items={["Workout sessions, exercises, sets, reps, and weights", "Body measurements: weight, height, body fat estimates", "Sleep duration, bedtime, wake time, and sleep quality ratings", "Water intake and daily activity data"]} />
              <DataRow title="Mental and emotional data" items={["Mood scores (1–5) with optional notes", "Journal entries you write", "Goal descriptions and progress"]} />
              <DataRow title="Biometric data" items={["Resting heart rate", "HRV (heart rate variability) readings you log", "Body fat percentage (estimated, not measured)"]} />
              <DataRow title="Account data" items={["Email address and username", "Account creation date", "App preferences and settings"]} />
              <DataRow title="Usage data (optional)" items={["Aggregated, anonymised product analytics if you consent", "No individual usage tracking without consent"]} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Why we collect it</h2>
            <ul className="flex flex-col gap-2 list-disc list-inside marker:text-text-muted">
              <li>To provide the core tracking features you use Arc for</li>
              <li>To calculate trends, streaks, and personal bests</li>
              <li>To surface correlations and insights across your data (with your consent)</li>
              <li>To maintain your account and send essential service communications</li>
              <li>To improve the product (only with explicit consent for anonymised analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Legal basis for processing</h2>
            <p>Under UK GDPR, health and biometric data is special-category data under Article 9. We process this data only with your <strong className="text-text-primary">explicit consent</strong>, which you provide through our granular consent flow. You can withdraw consent at any time in Settings → Data &amp; Privacy.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">How long we keep your data</h2>
            <p>We keep your data for as long as your account is active. If you delete your account, all personal data is permanently deleted within 30 days. Some anonymised, aggregate data (not linked to you) may be retained for product improvement purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Who we share it with</h2>
            <p className="mb-3">We use <strong className="text-text-primary">Supabase</strong> (our database provider, servers in the EU) to store your data securely. We do not share your data with any other third parties.</p>
            <div className="rounded-r4 border border-[var(--color-success)] bg-[rgba(34,197,94,0.06)] px-5 py-4 flex flex-col gap-1">
              <p className="font-semibold text-text-primary">We never sell your data or use it for advertising.</p>
              <p className="text-13 text-text-muted">Your health data is yours. We have no advertising business model and never will.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Your rights under UK GDPR</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Right of access", "Request a copy of all data we hold about you"],
                ["Right to correction", "Ask us to correct inaccurate data"],
                ["Right to erasure", "Delete your account and all data permanently"],
                ["Right to portability", "Export your data in JSON format from Settings"],
                ["Right to withdraw consent", "Change or remove consent at any time in Settings"],
                ["Right to object", "Object to any processing you haven't consented to"],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-r4 border border-border bg-bg-surface p-4">
                  <p className="font-medium text-text-primary text-14 mb-0.5">{title}</p>
                  <p className="text-12 text-text-muted">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-13">To exercise any of these rights, use Settings → Data &amp; Privacy or email <span className="text-text-primary">privacy@crest-weld.vercel.app</span>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Security</h2>
            <p>All data is encrypted in transit (TLS) and at rest. Access is controlled via Supabase row-level security — your data can only be accessed by your authenticated account. We never log or store plaintext passwords.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Cookies</h2>
            <p>We use a single session cookie to keep you logged in. We do not use advertising cookies or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Contact</h2>
            <p>For any data protection questions or to exercise your rights: <span className="text-text-primary">privacy@crest-weld.vercel.app</span></p>
            <p className="mt-2">If you are unsatisfied with our response, you have the right to complain to the Information Commissioner&apos;s Office (ICO): <span className="text-text-primary">ico.org.uk</span></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-13 text-text-muted">
          <Link href="/" className="hover:text-text-secondary transition-colors">← Arc home</Link>
          <Link href="/terms" className="hover:text-text-secondary transition-colors">Terms of service →</Link>
        </div>
      </div>
    </div>
  );
}

function DataRow({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-surface p-4 flex flex-col gap-2">
      <p className="font-medium text-text-primary">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="text-13 text-text-muted flex items-start gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-text-disabled flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
