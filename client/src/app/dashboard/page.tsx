"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Loader2, PackageCheck, Handshake, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ClaimedItemEntry, FinderHandoffItem } from "@/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: "active" | "claimed" | "returned" | "expired") {
  if (status === "returned") return "bg-emerald-100 text-emerald-700";
  if (status === "claimed") return "bg-blue-100 text-blue-700";
  if (status === "active") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function DashboardPage() {
  const { userId, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimedItems, setClaimedItems] = useState<ClaimedItemEntry[]>([]);
  const [handoffItems, setHandoffItems] = useState<FinderHandoffItem[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [claimedResponse, handoffsResponse] = await Promise.all([
          api.get("/api/items/my-claimed", { headers }),
          api.get("/api/items/my-handoffs", { headers }),
        ]);

        setClaimedItems(claimedResponse.data.data as ClaimedItemEntry[]);
        setHandoffItems(handoffsResponse.data.data as FinderHandoffItem[]);
      } catch (requestError: unknown) {
        const maybeMessage =
          typeof requestError === "object" &&
          requestError !== null &&
          "response" in requestError &&
          typeof (requestError as { response?: { data?: { message?: string } } }).response?.data
            ?.message === "string"
            ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message
            : "Failed to load dashboard data";

        setError(maybeMessage ?? "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [getToken, userId]);

  const claimedStillInHandoff = useMemo(
    () => claimedItems.filter((entry) => entry.item.status === "claimed"),
    [claimedItems]
  );

  if (!userId) {
    return (
      <div className="section-shell min-h-[calc(100vh-14rem)] p-6 sm:p-8">
        <div className="surface-card mx-auto max-w-2xl bg-white p-6 text-center sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Your Recovery Dashboard</h1>
          <p className="mt-3 text-sm text-[var(--ink-muted)] sm:text-base">
            Sign in to see items you successfully claimed and handoffs you completed as a finder.
          </p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <button className="rounded-xl bg-[var(--brand-deep)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell min-h-[calc(100vh-14rem)] px-4 py-6 sm:px-6">
      <main className="mx-auto max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Private workspace</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[var(--ink)]">Claims and Handoffs</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
            Track your approved claims as a claimer and your completed returns as a finder.
          </p>
        </header>

        {loading ? (
          <div className="surface-card flex items-center justify-center bg-white py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--ink-muted)]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface-card bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-[var(--brand-deep)]" />
                  <h2 className="text-lg font-semibold text-[var(--ink)]">Claimed Items (You as Claimer)</h2>
                </div>
                <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-deep)]">
                  {claimedItems.length}
                </span>
              </div>

              {claimedItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-sm text-[var(--ink-muted)]">
                  No approved claims yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {claimedItems.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/items/${entry.item.id}`}
                      className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition hover:border-[var(--brand)] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-semibold text-[var(--ink)]">{entry.item.description}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(entry.item.status)}`}>
                          {entry.item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-muted)]">Finder: {entry.item.finder.displayName || "Anonymous"}</p>
                      <p className="mt-1 text-xs text-[var(--ink-muted)]">Updated: {formatDate(entry.updatedAt)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="surface-card bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-[var(--brand-deep)]" />
                  <h2 className="text-lg font-semibold text-[var(--ink)]">Handoffed Items (You as Finder)</h2>
                </div>
                <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-deep)]">
                  {handoffItems.length}
                </span>
              </div>

              {handoffItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-sm text-[var(--ink-muted)]">
                  No completed handoffs yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {handoffItems.map((item) => {
                    const approvedClaim = item.claims[0];
                    return (
                      <Link
                        key={item.id}
                        href={`/items/${item.id}`}
                        className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition hover:border-[var(--brand)] hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-semibold text-[var(--ink)]">{item.description}</p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            returned
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          Claimer: {approvedClaim?.loser.displayName || "Anonymous"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          Handoff completed: {approvedClaim ? formatDate(approvedClaim.updatedAt) : formatDate(item.postedAt)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {!loading && !error && claimedStillInHandoff.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {claimedStillInHandoff.length} approved claim(s) still need both-side handoff confirmation.
            <Link href="/items" className="ml-1 inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline">
              Open items
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
