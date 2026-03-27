"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { getRealtimeSocket } from "@/lib/realtime/socket";
import campusData from "@/../public/campus-map-data.json";
import type { Item, Building, Claim, ClaimMessage } from "@/types";

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [myClaim, setMyClaim] = useState<Claim | null>(null);
  const [loadingMyClaim, setLoadingMyClaim] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClaimMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [confirmingHandoff, setConfirmingHandoff] = useState(false);

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [ownershipSignalsInputs, setOwnershipSignalsInputs] = useState<string[]>(["", ""]);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const buildings = campusData.buildings as Building[];

  useEffect(() => {
    async function fetchItem() {
      try {
        const { data } = await api.get(`/api/items/${id}`);
        setItem(data.data);
      } catch {
        setError("Item not found");
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  const isOwner = userId === item?.finder.clerkId;
  const canClaim = Boolean(userId && !isOwner && item?.status === "active");
  const ownershipSignals = ownershipSignalsInputs.map((signal) => signal.trim()).filter(Boolean);

  function updateSignal(index: number, value: string) {
    setOwnershipSignalsInputs((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  }

  function addSignalInput() {
    setOwnershipSignalsInputs((previous) => [...previous, ""]);
  }

  function removeSignalInput(index: number) {
    setOwnershipSignalsInputs((previous) => {
      if (previous.length <= 2) return previous;
      return previous.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function fetchItemClaims(options?: { silent?: boolean }) {
    if (!item || !isOwner) return;
    const silent = options?.silent ?? false;
    if (!silent) setLoadingClaims(true);

    try {
      const token = await getToken();
      const { data } = await api.get(`/api/items/${item.id}/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClaims(data.data as Claim[]);
    } catch {
      if (!silent) setError("Failed to load claims");
    } finally {
      if (!silent) setLoadingClaims(false);
    }
  }

  useEffect(() => {
    if (!loading && item && isOwner) {
      fetchItemClaims();
    }
  }, [loading, item, isOwner]);

  async function fetchMyClaim(options?: { silent?: boolean }) {
    if (!item || !userId || isOwner) return;

    const silent = options?.silent ?? false;
    if (!silent) setLoadingMyClaim(true);
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/items/${item.id}/my-claim`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyClaim((data.data as Claim | null) ?? null);
    } catch {
      if (!silent) setError("Failed to load your claim status");
    } finally {
      if (!silent) setLoadingMyClaim(false);
    }
  }

  useEffect(() => {
    if (!loading && item && userId && !isOwner) {
      fetchMyClaim();
    }
  }, [loading, item, userId, isOwner]);

  const approvedClaim = isOwner
    ? claims.find((claim) => claim.status === "approved") ?? null
    : myClaim && myClaim.status === "approved"
    ? myClaim
    : null;

  async function fetchClaimMessages(claimId: string, options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setLoadingMessages(true);
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/claims/${claimId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data.data as ClaimMessage[]);
    } catch {
      if (!silent) setError("Failed to load claim messages");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (approvedClaim?.id && userId) {
      fetchClaimMessages(approvedClaim.id);
    } else {
      setMessages([]);
    }
  }, [approvedClaim?.id, userId]);

  useEffect(() => {
    if (!userId || !item?.id) return;

    const socket = getRealtimeSocket(userId);
    const handleClaimStatusChanged = (payload?: { itemId?: string }) => {
      if (!payload?.itemId || payload.itemId !== item.id) return;

      if (isOwner) {
        fetchItemClaims({ silent: true });
      } else {
        fetchMyClaim({ silent: true });
      }
    };

    socket.on("claim:status:changed", handleClaimStatusChanged);

    return () => {
      socket.off("claim:status:changed", handleClaimStatusChanged);
    };
  }, [fetchItemClaims, fetchMyClaim, isOwner, item?.id, userId]);

  useEffect(() => {
    if (!userId || !approvedClaim?.id) return;

    const socket = getRealtimeSocket(userId);
    socket.emit("claim:join", approvedClaim.id);

    const handleNewMessage = (payload?: { claimId?: string }) => {
      if (!payload?.claimId || payload.claimId !== approvedClaim.id) return;
      fetchClaimMessages(approvedClaim.id, { silent: true });
    };

    const handleStatusUpdate = (payload?: { claimId?: string }) => {
      if (!payload?.claimId || payload.claimId !== approvedClaim.id) return;

      if (isOwner) {
        fetchItemClaims({ silent: true });
      } else {
        fetchMyClaim({ silent: true });
      }
    };

    socket.on("claim:message:new", handleNewMessage);
    socket.on("claim:status:changed", handleStatusUpdate);

    return () => {
      socket.emit("claim:leave", approvedClaim.id);
      socket.off("claim:message:new", handleNewMessage);
      socket.off("claim:status:changed", handleStatusUpdate);
    };
  }, [approvedClaim?.id, fetchClaimMessages, fetchItemClaims, fetchMyClaim, isOwner, userId]);

  async function handleSendMessage() {
    if (!approvedClaim?.id || !newMessage.trim()) return;

    setSendingMessage(true);
    setError(null);

    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/claims/${approvedClaim.id}/messages`,
        { content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((previous) => [...previous, data.data as ClaimMessage]);
      setNewMessage("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleConfirmHandoff() {
    if (!approvedClaim?.id) return;

    setConfirmingHandoff(true);
    setError(null);

    try {
      const token = await getToken();
      const { data } = await api.patch(
        `/api/claims/${approvedClaim.id}/confirm-handoff`,
        { confirm: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedClaim = data.data as Claim;
      if (isOwner) {
        setClaims((previous) =>
          previous.map((claim) => (claim.id === updatedClaim.id ? updatedClaim : claim))
        );
      } else {
        setMyClaim(updatedClaim);
      }

      const itemResponse = await api.get(`/api/items/${id}`);
      setItem(itemResponse.data.data as Item);

      setSuccessMessage("Handoff confirmation saved.");
    } catch {
      setError("Failed to confirm handoff");
    } finally {
      setConfirmingHandoff(false);
    }
  }

  function getLocationLabel(zoneId: string): string {
    for (const building of buildings) {
      const zone = building.zones.find((z) => z.id === zoneId);
      if (zone) return `${building.name} — ${zone.name}`;
    }
    return zoneId;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getCategoryName(catId: string): string {
    return ITEM_CATEGORIES.find((c) => c.id === catId)?.name || catId;
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setDeleting(true);
    try {
      const token = await getToken();
      await api.delete(`/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/items");
    } catch {
      setError("Failed to delete item");
      setDeleting(false);
    }
  }

  async function handleSubmitClaim() {
    if (ownershipSignals.length < 2) {
      setError("Provide at least 2 ownership signals before submitting");
      return;
    }

    setSubmittingClaim(true);
    setError(null);

    try {
      const token = await getToken();
      await api.post(
        `/api/items/${id}/claims`,
        {
          ownershipSignals,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchMyClaim({ silent: true });

      setOwnershipSignalsInputs(["", ""]);
      setShowClaimForm(false);
      setSuccessMessage("Claim submitted. The finder will review your verification details.");
    } catch (claimError: unknown) {
      const maybeMessage =
        typeof claimError === "object" &&
        claimError !== null &&
        "response" in claimError &&
        typeof (claimError as { response?: { data?: { message?: string } } }).response?.data
          ?.message === "string"
          ? (claimError as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to submit claim";
      setError(maybeMessage ?? "Failed to submit claim");
    } finally {
      setSubmittingClaim(false);
    }
  }

  async function handleReviewClaim(claimId: string, action: "approve" | "reject") {
    setReviewingClaimId(claimId);
    setError(null);

    try {
      const token = await getToken();
      await api.patch(
        `/api/claims/${claimId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const itemResponse = await api.get(`/api/items/${id}`);
      setItem(itemResponse.data.data as Item);
      await fetchItemClaims();
      setSuccessMessage(`Claim ${action === "approve" ? "approved" : "rejected"} successfully.`);
    } catch {
      setError(`Failed to ${action} claim`);
    } finally {
      setReviewingClaimId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-2)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-muted)]" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80">
        <AlertCircle className="h-12 w-12 text-[var(--ink-muted)]" />
        <p className="text-lg font-medium text-[var(--ink-muted)]">{error || "Item not found"}</p>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-[var(--brand-deep)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand)] transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-14rem)] rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-6 sm:px-6">
      <main className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            title="Go back"
            className="rounded-lg p-2 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--ink-muted)]" />
          </button>
          <h1 className="text-xl font-bold text-[var(--ink)]">Item Details</h1>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Photo */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <img
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_600,c_fill/${item.photoCloudinaryId}`}
              alt={item.description}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category + Status */}
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-medium text-[var(--ink-muted)]">
                {getCategoryName(item.category)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  item.status === "active"
                    ? "bg-green-50 text-green-700"
                    : item.status === "claimed"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
                }`}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>

            {/* Description */}
            <p className="text-base text-[var(--ink-muted)] leading-relaxed">{item.description}</p>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
              <MapPin className="h-4 w-4 text-[var(--ink-muted)]" />
              {getLocationLabel(item.locationZone)}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
              <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
              Posted {formatDate(item.postedAt)}
            </div>

            {/* Found By */}
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--ink-muted)]">
                {item.finder.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  {item.finder.displayName || "Anonymous"}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">Found this item</p>
              </div>
            </div>

            {!isOwner && userId && loadingMyClaim && (
              <p className="text-sm text-[var(--ink-muted)]">Loading your claim status...</p>
            )}

            {!isOwner && userId && myClaim && (
              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <p className="text-sm font-semibold text-[var(--ink)]">Your claim</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">Status: {myClaim.status}</p>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">{myClaim.verificationAttempt}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Show when="signed-in">
                {canClaim ? (
                  <button
                    onClick={() => setShowClaimForm((current) => !current)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-deep)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand)] transition-colors cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {showClaimForm ? "Cancel Claim" : "This is mine — Claim"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-3 text-sm font-semibold text-[var(--ink-muted)] cursor-not-allowed"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {isOwner ? "Your posted item" : "Claim unavailable"}
                  </button>
                )}

                {/* Delete button -- only for the finder */}
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    aria-label="Delete item"
                    title="Delete item"
                    className="flex items-center justify-center rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </Show>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-deep)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
                    <MessageCircle className="h-4 w-4" />
                    Sign in to claim
                  </button>
                </SignInButton>
              </Show>
            </div>

            {canClaim && showClaimForm && (
              <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-4">
                <p className="text-sm font-medium text-[var(--ink)]">Ownership signals (hidden from public)</p>
                <div className="space-y-3">
                  {ownershipSignalsInputs.map((signal, index) => (
                    <div key={`signal-${index}`} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--ink-muted)]">Signal {index + 1}</p>
                        {ownershipSignalsInputs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeSignalInput(index)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        value={signal}
                        onChange={(e) => updateSignal(index, e.target.value)}
                        rows={2}
                        placeholder="Add one private ownership detail"
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSignalInput}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
                >
                  Add another signal
                </button>

                <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
                  <span>Minimum 2 signals required</span>
                  <span>{ownershipSignals.length} signal(s)</span>
                </div>
                <button
                  onClick={handleSubmitClaim}
                  disabled={submittingClaim}
                  className="w-full rounded-lg bg-[var(--brand-deep)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand)] disabled:opacity-50"
                >
                  {submittingClaim ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            )}
          </div>
        </div>

        {isOwner && (
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Claim Review</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Review verification attempts from claimants.</p>

            {loadingClaims ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading claims...
              </div>
            ) : claims.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--ink-muted)]">No claims yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--ink)]">
                          {claim.loser.displayName || "Anonymous claimant"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">{claim.verificationAttempt}</p>
                        {claim.review && (
                          <p className="mt-1 text-xs text-[var(--ink-muted)]">
                            Confidence {claim.review.confidenceScore}% • matched markers {claim.review.matchedSignals}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-[var(--ink-muted)]">
                          Submitted {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          claim.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : claim.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-[var(--ink-muted)]"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    {claim.review && (
                      <div className="mt-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            claim.review.confidenceLevel === "high"
                              ? "bg-green-100 text-green-700"
                              : claim.review.confidenceLevel === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {claim.review.confidenceLevel.toUpperCase()} CONFIDENCE
                        </span>
                      </div>
                    )}

                    {claim.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleReviewClaim(claim.id, "approve")}
                          disabled={reviewingClaimId === claim.id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {reviewingClaimId === claim.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReviewClaim(claim.id, "reject")}
                          disabled={reviewingClaimId === claim.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {reviewingClaimId === claim.id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {approvedClaim && (
          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Approved Claim Handoff</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Coordinate handoff privately, then both sides confirm completion.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="font-medium text-[var(--ink)]">Finder confirmation</p>
                <p className="mt-1 text-[var(--ink-muted)]">
                  {approvedClaim.finderConfirmedAt
                    ? `Confirmed at ${formatDate(approvedClaim.finderConfirmedAt)}`
                    : "Pending"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="font-medium text-[var(--ink)]">Claimer confirmation</p>
                <p className="mt-1 text-[var(--ink-muted)]">
                  {approvedClaim.claimerConfirmedAt
                    ? `Confirmed at ${formatDate(approvedClaim.claimerConfirmedAt)}`
                    : "Pending"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)]">
              <div className="max-h-72 space-y-3 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-[var(--ink-muted)]">No messages yet. Start coordinating handoff details.</p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === (isOwner ? item.finderId : myClaim?.loserId);
                    return (
                      <div
                        key={message.id}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          mine ? "ml-auto max-w-[85%] bg-[var(--brand-deep)] text-white" : "max-w-[85%] bg-[var(--surface-2)] text-[var(--ink)]"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`mt-1 text-[11px] ${mine ? "text-gray-300" : "text-[var(--ink-muted)]"}`}>
                          {message.sender.displayName || "Anonymous"} • {formatDate(message.createdAt)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {item.status !== "returned" && (
                <div className="border-t border-[var(--border)] p-3">
                  <div className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Share where and when to meet"
                      className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-deep)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand)] disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            {item.status !== "returned" && (
              <button
                onClick={handleConfirmHandoff}
                disabled={
                  confirmingHandoff ||
                  (isOwner ? Boolean(approvedClaim.finderConfirmedAt) : Boolean(approvedClaim.claimerConfirmedAt))
                }
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {confirmingHandoff
                  ? "Saving confirmation..."
                  : isOwner
                  ? approvedClaim.finderConfirmedAt
                    ? "Finder already confirmed"
                    : "Confirm handoff (Finder)"
                  : approvedClaim.claimerConfirmedAt
                  ? "You already confirmed"
                  : "Confirm handoff (Claimer)"}
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

