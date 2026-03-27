import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Lock,
  Map,
  MessageSquareMore,
  Search,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-14rem)] overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,#fbfcfd_0%,#eff5f7_52%,#ecf2f5_100%)] text-[var(--ink)] shadow-[0_18px_52px_rgba(30,43,54,0.08)]">
      <div className="pointer-events-none absolute -left-16 top-8 h-44 w-44 rounded-full bg-[var(--brand-soft)]/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[#d7e8ea]/70 blur-3xl" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="animate-fade-up space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-[var(--brand-deep)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified ownership workflow
            </p>

            <h1 className="font-display text-balance text-4xl font-semibold leading-tight text-[var(--brand-deep)] sm:text-5xl lg:text-6xl">
              A Cleaner Way To Recover Lost Essentials On Campus
            </h1>

            <p className="max-w-2xl text-sm text-[var(--ink-muted)] sm:text-base lg:text-lg">
              Campus Return connects finders and owners through a structured trust process: proof-based claims,
              private handoff messaging, and two-sided completion confirmation. The result is safer recovery and
              fewer false claims.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/items"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-deep)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Search className="h-4 w-4" />
                Browse Items
              </Link>
              <Link
                href="/items/post"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)]"
              >
                <Plus className="h-4 w-4" />
                Report Found Item
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "Proof-first claims", text: "Ownership signals are private and reviewable." },
                { title: "Private coordination", text: "Approved parties chat in a protected handoff thread." },
                { title: "Traceable closure", text: "Both sides confirm handoff before final return status." },
              ].map((item) => (
                <div key={item.title} className="surface-card bg-white/80 p-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="animate-fade-up-delayed section-shell p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">How it works</h2>
            <div className="mt-4 space-y-4">
              {[
                { icon: Map, title: "1. Finder posts location context", text: "Include category, area, and non-sensitive details." },
                { icon: Lock, title: "2. Owner submits private proof", text: "Ownership signals stay hidden from public view." },
                { icon: MessageSquareMore, title: "3. Approved handoff is coordinated", text: "Participants use a private claim thread." },
                { icon: CheckCircle2, title: "4. Both sides confirm completion", text: "Item moves to returned only after dual confirmation." },
              ].map((step) => (
                <div key={step.title} className="rounded-xl border border-[var(--border)] bg-white px-3 py-3">
                  <div className="inline-flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-[var(--brand)]" />
                    <p className="text-sm font-semibold text-[var(--ink)]">{step.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">{step.text}</p>
                </div>
              ))}
            </div>

            <Link
              href="/analytics"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-deep)] hover:underline"
            >
              View live platform analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: Clock3, heading: "Faster recovery cycle", copy: "Structured routing reduces wasted back-and-forth and helps users close cases sooner." },
            { icon: ShieldCheck, heading: "Lower impostor risk", copy: "Private proof markers and finder review reduce fake ownership attempts." },
            { icon: CheckCircle2, heading: "Operational transparency", copy: "Public analytics and status tracking keep campus stakeholders informed." },
          ].map((feature) => (
            <div key={feature.heading} className="surface-card bg-white p-4 sm:p-5">
              <feature.icon className="h-5 w-5 text-[var(--brand)]" />
              <h3 className="mt-2 text-base font-semibold text-[var(--ink)]">{feature.heading}</h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{feature.copy}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
