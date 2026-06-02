import Link from "next/link";

export const metadata = { title: "Terms of Service — Crest" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-13 text-text-muted hover:text-text-secondary transition-colors">← Back to Crest</Link>
        </div>

        <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight mb-2">Terms of Service</h1>
        <p className="text-13 text-text-muted mb-10">Last updated: January 2026</p>

        <div className="flex flex-col gap-10 text-15 text-text-secondary leading-relaxed">

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Who can use Crest</h2>
            <p>Crest is available to users aged <strong className="text-text-primary">13 and over</strong>. This aligns with the UK GDPR child threshold. If you are under 13, please do not create an account. By using Crest, you confirm you meet this age requirement.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">What Crest is — and isn&apos;t</h2>
            <p className="mb-3">Crest is a <strong className="text-text-primary">personal tracking tool</strong>. It helps you log and visualise health, fitness, mood, and habit data.</p>
            <div className="rounded-r4 border border-warning bg-[rgba(245,158,11,0.06)] px-5 py-4">
              <p className="font-semibold text-text-primary mb-1">Crest is not a medical device or medical advice.</p>
              <p className="text-13 text-text-muted">Nothing in Crest should be used to diagnose, treat, or manage any medical condition. All metrics (body fat estimates, readiness scores, HRV trends) are personal tracking aids, not clinical measurements. Always consult a qualified healthcare professional for medical decisions.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Your responsibility</h2>
            <ul className="flex flex-col gap-2 list-disc list-inside marker:text-text-muted">
              <li>You are responsible for all decisions related to your health, fitness, and wellbeing</li>
              <li>You are responsible for keeping your account credentials secure</li>
              <li>You agree not to misuse Crest or attempt to access other users&apos; data</li>
              <li>You agree not to upload content that is illegal, abusive, or violates others&apos; rights</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Your data</h2>
            <p>All data you log in Crest belongs to you. You can export it or delete it at any time from Settings → Data &amp; Privacy. See our <Link href="/privacy" className="text-accent hover:text-accent-hover transition-colors">Privacy Policy</Link> for full details on how we handle your data.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Account termination</h2>
            <p>You may delete your account at any time from Settings → Data &amp; Privacy. We may suspend or terminate accounts that violate these terms, with notice where possible.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Service availability</h2>
            <p>Crest is provided as-is. We aim for high availability but cannot guarantee uninterrupted service. We may update or change features with reasonable notice.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Limitation of liability</h2>
            <p>To the fullest extent permitted by law, Crest and its creators are not liable for any indirect, incidental, or consequential damages arising from your use of the app. Our total liability for any claim is limited to the amount you paid to use Crest in the 12 months preceding the claim (which is £0 for free accounts).</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Changes to these terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email or in-app notice. Continued use of Crest after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Governing law</h2>
            <p>These terms are governed by the laws of England and Wales.</p>
          </section>

          <section>
            <h2 className="font-display text-20 font-semibold text-text-primary mb-4">Contact</h2>
            <p>Questions about these terms: <span className="text-text-primary">legal@crest-weld.vercel.app</span></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-13 text-text-muted">
          <Link href="/privacy" className="hover:text-text-secondary transition-colors">← Privacy policy</Link>
          <Link href="/" className="hover:text-text-secondary transition-colors">Crest home →</Link>
        </div>
      </div>
    </div>
  );
}
