import { prisma } from "../config/database.js";
import { emitToClaim, emitToUser } from "../socket/realtime.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import type {
  CreateClaimInput,
  CreateClaimMessageInput,
  UpdateClaimStatusInput,
} from "../validators/claim.validator.js";

async function createNotificationSafe(data: {
  userId: string;
  type: string;
  relatedItemId?: string;
  content?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        relatedItemId: data.relatedItemId,
        content: data.content,
      },
    });
  } catch (error) {
    // Approval/rejection should not fail if notification persistence has an issue.
    logger.error(
      {
        err: error,
        userId: data.userId,
        type: data.type,
        relatedItemId: data.relatedItemId,
      },
      "Failed to persist notification side effect"
    );
  }
}

async function createManyNotificationsSafe(
  notifications: Array<{
    userId: string;
    type: string;
    relatedItemId?: string;
    content?: string;
  }>
) {
  try {
    await prisma.notification.createMany({ data: notifications });
  } catch (error) {
    logger.error(
      {
        err: error,
        count: notifications.length,
        userIds: notifications.map((notification) => notification.userId),
      },
      "Failed to persist notification batch side effect"
    );
  }
}

type ClaimConfidenceLevel = "low" | "medium" | "high";

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function buildVerificationAttempt(data: CreateClaimInput): string {
  if (data.ownershipSignals && data.ownershipSignals.length > 0) {
    return data.ownershipSignals
      .map((signal, index) => `Signal ${index + 1}: ${sanitizePlainText(signal)}`)
      .join("\n")
      .trim();
  }

  return sanitizePlainText(data.verificationAttempt ?? "");
}

function computeClaimConfidence(secretMarkers: string[], verificationAttempt: string): {
  confidenceScore: number;
  confidenceLevel: ClaimConfidenceLevel;
  matchedSignals: number;
} {
  const normalizedAttempt = normalizeText(verificationAttempt);
  const normalizedMarkers = secretMarkers.map(normalizeText).filter(Boolean);

  if (normalizedMarkers.length === 0) {
    return { confidenceScore: 0, confidenceLevel: "low", matchedSignals: 0 };
  }

  let matchedSignals = 0;
  for (const marker of normalizedMarkers) {
    if (marker.length > 0 && normalizedAttempt.includes(marker)) {
      matchedSignals += 1;
    }
  }

  const ratio = matchedSignals / normalizedMarkers.length;
  const textLengthBonus = Math.min(verificationAttempt.length / 300, 1) * 0.15;
  const confidenceScore = Math.min(1, ratio * 0.85 + textLengthBonus);

  let confidenceLevel: ClaimConfidenceLevel = "low";
  if (confidenceScore >= 0.7) confidenceLevel = "high";
  else if (confidenceScore >= 0.4) confidenceLevel = "medium";

  return {
    confidenceScore: Number((confidenceScore * 100).toFixed(0)),
    confidenceLevel,
    matchedSignals,
  };
}

export async function createClaim(itemId: string, loserId: string, data: CreateClaimInput) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, finderId: true, status: true },
  });

  if (!item) throw new NotFoundError("Item");
  if (item.finderId === loserId) {
    throw new ForbiddenError("You cannot claim your own item");
  }
  if (item.status !== "active") {
    throw new ConflictError("This item is no longer available for claims");
  }

  const existingPending = await prisma.claim.findFirst({
    where: { itemId, loserId, status: "pending" },
    select: { id: true },
  });

  if (existingPending) {
    throw new ConflictError("You already have a pending claim for this item");
  }

  const verificationAttempt = buildVerificationAttempt(data);
  if (!verificationAttempt) {
    throw new ConflictError("Claim verification details are required");
  }

  const createdClaim = await prisma.claim.create({
    data: {
      itemId,
      loserId,
      verificationAttempt,
    },
    include: {
      loser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: item.finderId,
      type: "claim_received",
      relatedItemId: itemId,
      content: "A new claim was submitted for your posted item.",
    },
  });

  emitToUser(item.finderId, "notification:new", {
    type: "claim_received",
    relatedItemId: itemId,
  });
  emitToUser(item.finderId, "claim:status:changed", { itemId });

  return createdClaim;
}

export async function getClaimsForItem(itemId: string, finderId: string) {
  const item = (await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, finderId: true, secretMarkers: true },
  } as never)) as { id: string; finderId: string; secretMarkers: string[] } | null;

  if (!item) throw new NotFoundError("Item");
  if (item.finderId !== finderId) {
    throw new ForbiddenError("Only the finder can review claims for this item");
  }

  const claims = await prisma.claim.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    include: {
      loser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return claims.map((claim) => ({
    ...claim,
    review: computeClaimConfidence(item.secretMarkers ?? [], claim.verificationAttempt),
  }));
}

export async function getMyClaimForItem(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true },
  });

  if (!item) throw new NotFoundError("Item");

  return prisma.claim.findFirst({
    where: {
      itemId,
      loserId: userId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      loser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });
}

export async function updateClaimStatus(
  claimId: string,
  finderId: string,
  input: UpdateClaimStatusInput
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      item: {
        select: { id: true, finderId: true, status: true },
      },
      loser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  if (!claim) throw new NotFoundError("Claim");
  if (claim.item.finderId !== finderId) {
    throw new ForbiddenError("Only the finder can review this claim");
  }
  if (claim.status !== "pending") {
    throw new ConflictError("This claim has already been reviewed");
  }

  if (input.action === "reject") {
    const rejectedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: { status: "rejected" },
      include: {
        loser: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    await createNotificationSafe({
      userId: claim.loserId,
      type: "claim_status",
      relatedItemId: claim.itemId,
      content: "Your claim was rejected by the finder.",
    });

    emitToUser(claim.loserId, "notification:new", {
      type: "claim_status",
      relatedItemId: claim.itemId,
    });
    emitToUser(claim.loserId, "claim:status:changed", { itemId: claim.itemId });
    emitToUser(claim.item.finderId, "claim:status:changed", { itemId: claim.itemId });

    return rejectedClaim;
  }

  if (claim.item.status !== "active") {
    throw new ConflictError("This item is already claimed or unavailable");
  }

  const updatedClaim = await prisma.$transaction(async (tx) => {
    const approvedClaim = await tx.claim.update({
      where: { id: claimId },
      data: { status: "approved" },
      include: {
        loser: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    await tx.item.update({
      where: { id: claim.itemId },
      data: { status: "claimed" },
    });

    await tx.claim.updateMany({
      where: {
        itemId: claim.itemId,
        status: "pending",
        id: { not: claimId },
      },
      data: { status: "rejected" },
    });

    return approvedClaim;
  });

  await createNotificationSafe({
    userId: claim.loserId,
    type: "claim_status",
    relatedItemId: claim.itemId,
    content: "Your claim was approved. Coordinate handoff in the private thread.",
  });

  emitToUser(claim.loserId, "notification:new", {
    type: "claim_status",
    relatedItemId: claim.itemId,
  });
  emitToUser(claim.loserId, "claim:status:changed", { itemId: claim.itemId });
  emitToUser(claim.item.finderId, "claim:status:changed", { itemId: claim.itemId });

  return updatedClaim;
}

type HandoffParticipantClaim = {
  id: string;
  status: string;
  loserId: string;
  finderConfirmedAt: Date | null;
  claimerConfirmedAt: Date | null;
  item: {
    id: string;
    finderId: string;
    status: string;
  };
};

async function getClaimWithParticipants(claimId: string) {
  return ((await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      item: {
        select: { id: true, finderId: true, status: true },
      },
      loser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  } as never)) as unknown) as HandoffParticipantClaim & {
    loser: { id: string; displayName: string | null; avatarUrl: string | null };
  };
}

async function finalizeHandoffIfReady(claim: HandoffParticipantClaim) {
  const shouldFinalize =
    Boolean(claim.finderConfirmedAt) &&
    Boolean(claim.claimerConfirmedAt) &&
    claim.item.status !== "returned";

  if (!shouldFinalize) return;

  await prisma.item.update({
    where: { id: claim.item.id },
    data: { status: "returned" },
  });

  await createManyNotificationsSafe([
    {
      userId: claim.item.finderId,
      type: "handoff_completed",
      relatedItemId: claim.item.id,
      content: "Handoff completed. Item marked as returned.",
    },
    {
      userId: claim.loserId,
      type: "handoff_completed",
      relatedItemId: claim.item.id,
      content: "Handoff completed. Item marked as returned.",
    },
  ]);

  emitToUser(claim.item.finderId, "notification:new", {
    type: "handoff_completed",
    relatedItemId: claim.item.id,
  });
  emitToUser(claim.loserId, "notification:new", {
    type: "handoff_completed",
    relatedItemId: claim.item.id,
  });
  emitToClaim(claim.id, "claim:status:changed", {
    claimId: claim.id,
    itemId: claim.item.id,
    status: "returned",
  });
}

async function getParticipantClaim(claimId: string, userId: string): Promise<HandoffParticipantClaim> {
  const claim = (await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      item: {
        select: { id: true, finderId: true, status: true },
      },
    },
  } as never)) as HandoffParticipantClaim | null;

  if (!claim) throw new NotFoundError("Claim");

  const isFinder = claim.item.finderId === userId;
  const isClaimer = claim.loserId === userId;
  if (!isFinder && !isClaimer) {
    throw new ForbiddenError("Only handoff participants can access this claim thread");
  }

  if (claim.status !== "approved") {
    throw new ConflictError("This claim is not approved for handoff");
  }

  return claim;
}

export async function getClaimMessages(claimId: string, userId: string) {
  await getParticipantClaim(claimId, userId);

  return prisma.message.findMany({
    where: { claimId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });
}

export async function createClaimMessage(
  claimId: string,
  senderId: string,
  input: CreateClaimMessageInput
) {
  const claim = await getParticipantClaim(claimId, senderId);

  const message = await prisma.message.create({
    data: {
      claimId,
      senderId,
      content: sanitizePlainText(input.content),
    },
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  const recipientId = claim.item.finderId === senderId ? claim.loserId : claim.item.finderId;
  await createNotificationSafe({
    userId: recipientId,
    type: "new_message",
    relatedItemId: claim.item.id,
    content: "You have a new handoff message.",
  });

  emitToUser(recipientId, "notification:new", {
    type: "new_message",
    relatedItemId: claim.item.id,
  });
  emitToClaim(claimId, "claim:message:new", {
    claimId,
    itemId: claim.item.id,
  });

  return message;
}

export async function confirmHandoff(claimId: string, userId: string) {
  const claim = await getParticipantClaim(claimId, userId);
  const isFinder = claim.item.finderId === userId;

  // Recovery path: if both confirmations already exist but item status is stale,
  // finalize handoff and return success instead of surfacing a conflict.
  if (claim.finderConfirmedAt && claim.claimerConfirmedAt) {
    await finalizeHandoffIfReady(claim);
    const refreshed = await getClaimWithParticipants(claimId);
    return refreshed;
  }

  if (isFinder && claim.finderConfirmedAt) {
    const refreshed = await getClaimWithParticipants(claimId);
    return refreshed;
  }

  if (!isFinder && claim.claimerConfirmedAt) {
    const refreshed = await getClaimWithParticipants(claimId);
    return refreshed;
  }

  const updateData = (isFinder
    ? { finderConfirmedAt: claim.finderConfirmedAt ?? new Date() }
    : { claimerConfirmedAt: claim.claimerConfirmedAt ?? new Date() }) as never;

  const updatedClaim = ((await prisma.claim.update({
    where: { id: claimId },
    data: updateData,
    include: {
      item: {
        select: { id: true, finderId: true, status: true },
      },
      loser: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  } as never)) as unknown) as HandoffParticipantClaim & {
    loser: { id: string; displayName: string | null; avatarUrl: string | null };
  };

  if (updatedClaim.finderConfirmedAt && updatedClaim.claimerConfirmedAt) {
    await finalizeHandoffIfReady(updatedClaim);
    const refreshed = await getClaimWithParticipants(claimId);
    return refreshed;
  } else {
    const otherPartyId = isFinder ? updatedClaim.loserId : updatedClaim.item.finderId;
    await createNotificationSafe({
      userId: otherPartyId,
      type: "handoff_update",
      relatedItemId: updatedClaim.item.id,
      content: isFinder
        ? "Finder confirmed handoff. Confirm from your side to complete."
        : "Claimer confirmed handoff. Confirm from your side to complete.",
    });

    emitToUser(otherPartyId, "notification:new", {
      type: "handoff_update",
      relatedItemId: updatedClaim.item.id,
    });
    emitToClaim(claimId, "claim:status:changed", {
      claimId,
      itemId: updatedClaim.item.id,
      status: "claimed",
    });

    const refreshed = await getClaimWithParticipants(claimId);
    return refreshed;
  }
}
