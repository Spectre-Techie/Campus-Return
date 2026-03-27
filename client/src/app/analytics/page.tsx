"use client";

import { useEffect, useState } from "react";
import { Loader2, Activity, CheckCircle2, Clock3, BarChart3, MapPinned } from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { api } from "@/lib/api";
import { ANALYTICS_CHART_STYLE, ANALYTICS_STATUS_COLORS } from "@/lib/constants";
import type { PublicAnalytics } from "@/types";

type PieSlice = {
  key: "active" | "claimed" | "returned";
  label: string;
  value: number;
  colorHex: string;
};

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="surface-card bg-white p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[var(--ink-muted)] sm:text-sm">{subtitle}</p>
    </div>
  );
}

function StatusBarChart({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const chartData = slices.map((slice) => ({
    ...slice,
    percent: total > 0 ? Number(((slice.value / total) * 100).toFixed(1)) : 0,
  }));

  return (
    <div className="surface-card bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[var(--ink)]">Item Status Breakdown</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">Live distribution of active, claimed, and returned items.</p>

      <div className="mt-5">
        <div className="h-72 w-full" aria-label="Item status bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 6, right: 24, left: 16, bottom: 6 }}>
              <CartesianGrid strokeDasharray="4 6" stroke="#d9e2e6" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5d727c", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={90}
                tick={{ fill: "#20353f", fontSize: 13, fontWeight: 600 }}
              />
              <Tooltip
                formatter={(value, _name, payload) => {
                  const count = Number(value ?? 0);
                  const percent = Number(payload?.payload?.percent ?? 0);
                  return [`${count} items (${percent}%)`, "Status"];
                }}
                contentStyle={{
                  borderRadius: ANALYTICS_CHART_STYLE.tooltipRadius,
                  border: `1px solid ${ANALYTICS_CHART_STYLE.tooltipBorder}`,
                }}
              />
              <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                {chartData.map((slice) => (
                  <Cell key={slice.key} fill={slice.colorHex} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value) => `${value ?? 0} items`}
                  style={{ fill: "#20353f", fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {slices.map((slice) => {
            const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={slice.label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-sm">
                <span className="inline-flex items-center gap-2 text-[var(--ink)] font-medium">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.colorHex }} />
                  {slice.label}
                </span>
                <p className="mt-1 text-[var(--ink-muted)]">{slice.value} items ({pct}%)</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PublicAnalytics | null>(null);

  const statusSlices: PieSlice[] = analytics
    ? [
        {
          key: "active",
          label: "Active",
          value: analytics.totals.activeItems,
          colorHex: ANALYTICS_STATUS_COLORS.active,
        },
        {
          key: "claimed",
          label: "Claimed",
          value: analytics.totals.claimedItems,
          colorHex: ANALYTICS_STATUS_COLORS.claimed,
        },
        {
          key: "returned",
          label: "Returned",
          value: analytics.totals.returnedItems,
          colorHex: ANALYTICS_STATUS_COLORS.returned,
        },
      ]
    : [];

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/api/items/analytics");
        setAnalytics(data.data as PublicAnalytics);
      } catch {
        setError("Failed to load public analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <div className="section-shell min-h-[calc(100vh-14rem)] px-4 py-6 sm:px-6">
      <main className="mx-auto max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Public insights</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[var(--ink)]">Campus Recovery Analytics</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
            Live development metrics showing platform activity and handoff performance.
          </p>
        </header>

        {loading ? (
          <div className="surface-card flex items-center justify-center bg-white py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--ink-muted)]" />
          </div>
        ) : error || !analytics ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error || "Analytics unavailable"}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Items"
                value={analytics.totals.totalItems.toLocaleString()}
                subtitle="All posted items"
              />
              <StatCard
                title="Active Items"
                value={analytics.totals.activeItems.toLocaleString()}
                subtitle="Currently open for claims"
              />
              <StatCard
                title="Returned Items"
                value={analytics.totals.returnedItems.toLocaleString()}
                subtitle="Completed handoffs"
              />
              <StatCard
                title="Total Claims"
                value={analytics.totals.totalClaims.toLocaleString()}
                subtitle="Submitted ownership claims"
              />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="surface-card bg-white p-4 sm:p-5">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
                  <Activity className="h-5 w-5 text-[var(--brand-deep)]" />
                  Performance Rates
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-[var(--ink-muted)]">
                      <CheckCircle2 className="h-4 w-4" /> Handoff completion rate
                    </span>
                    <span className="font-semibold text-[var(--ink)]">{analytics.totals.handoffCompletionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-[var(--ink-muted)]">
                      <BarChart3 className="h-4 w-4" /> Claim approval rate
                    </span>
                    <span className="font-semibold text-[var(--ink)]">{analytics.totals.claimApprovalRate}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-[var(--ink-muted)]">
                      <Clock3 className="h-4 w-4" /> Pending claims
                    </span>
                    <span className="font-semibold text-[var(--ink)]">{analytics.totals.pendingClaims}</span>
                  </div>
                </div>
              </div>

              <div className="surface-card bg-white p-4 sm:p-5">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
                  <MapPinned className="h-5 w-5 text-[var(--brand-deep)]" />
                  Top Locations
                </h2>
                <div className="mt-4 space-y-2">
                  {analytics.topLocations.length === 0 ? (
                    <p className="text-sm text-[var(--ink-muted)]">No location data yet.</p>
                  ) : (
                    analytics.topLocations.map((entry) => (
                      <div
                        key={entry.value}
                        className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2 text-sm"
                      >
                        <span className="text-[var(--ink)]">{entry.value}</span>
                        <span className="font-semibold text-[var(--ink-muted)]">{entry.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6">
              <StatusBarChart slices={statusSlices} />
            </section>

            <section className="surface-card mt-6 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-[var(--ink)]">Top Categories</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.topCategories.length === 0 ? (
                  <p className="text-sm text-[var(--ink-muted)]">No category data yet.</p>
                ) : (
                  analytics.topCategories.map((entry) => (
                    <div
                      key={entry.value}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    >
                      <span className="text-[var(--ink)]">{entry.value}</span>
                      <span className="font-semibold text-[var(--ink-muted)]">{entry.count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
