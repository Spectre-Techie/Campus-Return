"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronDown,
  Clock,
  MapPin,
  Filter,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { ITEM_CATEGORIES, TIME_RANGES } from "@/lib/constants";
import campusData from "@/../public/campus-map-data.json";
import type { Item, Building, Pagination } from "@/types";

function ItemsFeedContent() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTime, setSelectedTime] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const buildings = campusData.buildings as Building[];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedLocation) params.set("location", selectedLocation);
      if (selectedTime !== "all") params.set("timeRange", selectedTime);

      const { data } = await api.get(`/api/items/search?${params.toString()}`);
      setItems(data.data.items);
      setPagination(data.data.pagination);
    } catch {
      console.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, selectedTime]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function getLocationLabel(zoneId: string): string {
    for (const building of buildings) {
      const zone = building.zones.find((z) => z.id === zoneId);
      if (zone) return `${building.name} — ${zone.name}`;
    }
    return zoneId;
  }

  function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function getCategoryName(id: string): string {
    return ITEM_CATEGORIES.find((c) => c.id === id)?.name || id;
  }

  return (
    <div className="section-shell min-h-[calc(100vh-14rem)] px-4 py-6 sm:px-6">
      <main className="mx-auto max-w-7xl">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="surface-card flex flex-1 items-center gap-2 bg-white px-4 py-3">
              <Search className="h-5 w-5 text-[var(--ink-muted)]" />
              <input
                type="text"
                placeholder="Search item description or clue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                showFilters
                  ? "border-[var(--brand-deep)] bg-[var(--brand-deep)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--ink-muted)] hover:border-[var(--brand)]"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="surface-card space-y-4 bg-white p-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                      !selectedCategory
                        ? "bg-[var(--brand-deep)] text-white"
                        : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:bg-[var(--brand-soft)]"
                    }`}
                  >
                    All
                  </button>
                  {ITEM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id === selectedCategory ? "" : cat.id)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-[var(--brand-deep)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:bg-[var(--brand-soft)]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="items-location-filter" className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
                  Location
                </label>
                <div className="relative">
                  <select
                    id="items-location-filter"
                    aria-label="Filter by location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 pr-8 text-sm text-[var(--ink)] outline-none cursor-pointer"
                  >
                    <option value="">All locations</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
                  Time
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedTime(range.value)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                        selectedTime === range.value
                          ? "bg-[var(--brand-deep)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:bg-[var(--brand-soft)]"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-muted)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-4 h-12 w-12 text-[var(--ink-muted)]/40" />
            <p className="text-lg font-medium text-[var(--ink)]">No items found</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Try adjusting filters or search text.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="surface-card group overflow-hidden bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[0_10px_24px_rgba(30,43,54,0.12)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_450,c_fill/${item.photoCloudinaryId}`}
                    alt={item.description}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand-deep)]">
                      {getCategoryName(item.category)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(item.postedAt)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-[var(--ink)]">{item.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                    <MapPin className="h-3 w-3" />
                    {getLocationLabel(item.locationZone)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="text-sm text-[var(--ink-muted)]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ItemsFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-muted)]" />
        </div>
      }
    >
      <ItemsFeedContent />
    </Suspense>
  );
}
