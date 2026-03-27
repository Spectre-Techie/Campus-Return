"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  Upload,
  X,
  MapPin,
  ChevronDown,
  Loader2,
  Smartphone,
  BookOpen,
  Shirt,
  Watch,
  Key,
  Briefcase,
  CreditCard,
  Package,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { ITEM_CATEGORIES, MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH } from "@/lib/constants";
import campusData from "@/../public/campus-map-data.json";
import type { Building } from "@/types";

const ICON_MAP: Record<string, LucideIcon> = {
  Smartphone,
  BookOpen,
  Shirt,
  Watch,
  Key,
  Briefcase,
  CreditCard,
  Package,
};

const SENSITIVE_CATEGORIES = new Set(["electronics", "keys", "id-cards", "bags"]);

export default function PostItemPage() {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [secretMarkersInputs, setSecretMarkersInputs] = useState<string[]>([""]);
  const [confirmHiddenDetails, setConfirmHiddenDetails] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildings = campusData.buildings as Building[];
  const selectedBuildingData = buildings.find((b) => b.id === selectedBuilding);
  const secretMarkers = secretMarkersInputs.map((item) => item.trim()).filter(Boolean);

  function updateMarker(index: number, value: string) {
    setSecretMarkersInputs((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  }

  function addMarkerInput() {
    setSecretMarkersInputs((previous) => [...previous, ""]);
  }

  function removeMarkerInput(index: number) {
    setSecretMarkersInputs((previous) => {
      if (previous.length <= 1) return previous;
      return previous.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setPhotoFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
    formData.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("Failed to upload image");
    const data = await response.json();
    return data.public_id as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photoFile) {
      setError("Please select a photo");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
      return;
    }
    if (!selectedZone) {
      setError("Please select a location");
      return;
    }
    if (secretMarkers.length === 0) {
      setError("Add at least one private proof marker before posting");
      return;
    }
    if (SENSITIVE_CATEGORIES.has(category) && secretMarkers.length < 2) {
      setError("Sensitive categories require at least 2 private proof markers");
      return;
    }
    if (!confirmHiddenDetails) {
      setError("Confirm that your photo does not reveal full ownership details");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload photo to Cloudinary
      const photoCloudinaryId = await uploadToCloudinary(photoFile);

      // 2. Create item via API
      const token = await getToken();
      await api.post(
        "/api/items",
        {
          category,
          description,
          secretMarkers,
          photoCloudinaryId,
          locationZone: selectedZone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const serverMessage =
          (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
        setError(serverMessage || "Failed to post item");
      } else {
        setError(err instanceof Error ? err.message : "Failed to post item");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoaded && !userId) {
    return (
      <div className="surface-card mx-auto max-w-xl bg-[var(--surface)] px-6 py-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">Sign in to post found items</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Posting is protected so only verified users can submit and manage item reports.
        </p>
        <SignInButton mode="modal">
          <button className="mt-6 rounded-xl bg-[var(--brand-deep)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Continue with sign in
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="section-shell min-h-[calc(100vh-14rem)] px-4 py-6 sm:px-6">
      <main className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            title="Go back"
            className="rounded-lg p-2 transition-colors hover:bg-[var(--brand-soft)] cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--ink-muted)]" />
          </button>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Post a Found Item</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
              Photo
            </h2>
            {photoPreview ? (
              <div className="relative w-full max-w-sm">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full rounded-xl border border-[var(--border)] object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  aria-label="Remove selected photo"
                  title="Remove selected photo"
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-md transition-colors hover:bg-red-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-white p-8 text-[var(--ink-muted)] hover:border-[var(--brand)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Click to upload photo</span>
                <span className="text-xs">JPG, PNG, WebP — max 5MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              aria-label="Upload item photo"
              title="Upload item photo"
              className="hidden"
            />
          </section>

          {/* Category */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
              Category
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ITEM_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Package;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--brand-deep)] bg-[var(--brand-deep)] text-white"
                        : "border-[var(--border)] bg-white text-[var(--ink-muted)] hover:border-[var(--brand)]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
              Description
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              placeholder="Describe the item — color, brand, distinguishing features..."
              rows={4}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70 outline-none transition-colors resize-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
            <p className="mt-1 text-right text-xs text-[var(--ink-muted)]">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </section>

          {/* Private Proof Markers */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
              Private Proof Markers (Hidden)
            </h2>
            <p className="mb-2 text-sm text-[var(--ink-muted)]">
              Add details that are not visible in the public post. Claimants must know these details.
            </p>
            {SENSITIVE_CATEGORIES.has(category) && (
              <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This is a sensitive category. Add at least 2 private proof markers.
              </p>
            )}

            <div className="surface-card space-y-3 bg-white p-4">
              <p className="text-sm font-medium text-[var(--ink)]">Ownership markers (hidden from public)</p>
              {secretMarkersInputs.map((marker, index) => (
                <div key={`marker-${index}`} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--ink-muted)]">Marker {index + 1}</p>
                    {secretMarkersInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMarkerInput(index)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <textarea
                    value={marker}
                    onChange={(e) => updateMarker(index, e.target.value)}
                    aria-label={`Private proof marker ${index + 1}`}
                    placeholder="Add one private ownership detail"
                    rows={2}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addMarkerInput}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
              >
                Add another marker
              </button>

              <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
                <span>Minimum 1 marker required</span>
                <span>{secretMarkers.length} marker(s)</span>
              </div>
            </div>

            <label className="mt-3 flex items-start gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={confirmHiddenDetails}
                onChange={(e) => setConfirmHiddenDetails(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              I confirm that this photo does not expose all identifying details of the item.
            </label>
          </section>

          {/* Location Picker */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-muted)]">
              <MapPin className="mr-1 inline h-4 w-4" />
              Where was it found?
            </h2>

            {/* Building Select */}
            <div className="relative mb-3">
              <label htmlFor="post-building-select" className="sr-only">
                Select building
              </label>
              <select
                id="post-building-select"
                aria-label="Select building"
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  setSelectedZone("");
                }}
                className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 pr-10 text-[var(--ink)] outline-none transition-colors cursor-pointer focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              >
                <option value="">Select building...</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-muted)]" />
            </div>

            {/* Zone Select */}
            {selectedBuildingData && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedBuildingData.zones.map((zone) => {
                  const isSelected = selectedZone === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZone(zone.id)}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--brand-deep)] bg-[var(--brand-deep)] text-white"
                          : "border-[var(--border)] bg-white text-[var(--ink-muted)] hover:border-[var(--brand)]"
                      }`}
                    >
                      {zone.name}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-deep)] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--brand)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Item"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
