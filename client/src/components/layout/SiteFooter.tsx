import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--border)] bg-[var(--surface)]/95">
      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight text-[var(--brand-deep)]">Campus Return</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--ink-muted)]">
            Reliable campus recovery
          </p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            A practical platform for secure claims, verified handoffs, and transparent recovery analytics.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Product</p>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <Link href="/" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">Overview</Link>
            <Link href="/items" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">Item board</Link>
            <Link href="/dashboard" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">My flow</Link>
            <Link href="/analytics" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">Public analytics</Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Recovery model</p>
          <div className="mt-2 space-y-1.5 text-sm text-[var(--ink-muted)]">
            <p>Private proof markers to prevent impostor claims.</p>
            <p>Claim review controlled by the finder.</p>
            <p>Dual confirmation to close each handoff.</p>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-3 text-center text-xs text-[var(--ink-muted)] sm:px-6">
        Campus Return • Built for trustworthy and fast campus lost-and-found recovery.
      </div>
    </footer>
  );
}
