import { prisma } from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { sanitizeList, sanitizePlainText } from "../utils/sanitize.js";
import type { CreateItemInput, SearchItemsInput } from "../validators/item.validator.js";

const ITEM_EXPIRY_DAYS = 30;

export async function createItem(finderId: string, data: CreateItemInput) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ITEM_EXPIRY_DAYS);

  const category = sanitizePlainText(data.category);
  const description = sanitizePlainText(data.description);
  const secretMarkers = sanitizeList(data.secretMarkers);
  const photoCloudinaryId = sanitizePlainText(data.photoCloudinaryId);
  const locationZone = sanitizePlainText(data.locationZone);

  return prisma.item.create({
    data: {
      finderId,
      category,
      description,
      secretMarkers,
      photoCloudinaryId,
      photoBlurRegions: data.photoBlurRegions ?? undefined,
      locationZone,
      expiresAt,
    },
    select: {
      id: true,
      finderId: true,
      category: true,
      description: true,
      photoCloudinaryId: true,
      photoBlurRegions: true,
      locationZone: true,
      postedAt: true,
      expiresAt: true,
      status: true,
      finder: {
        select: { id: true, clerkId: true, displayName: true, avatarUrl: true },
      },
      _count: { select: { claims: true } },
    },
  });
}

export async function getItemById(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      finderId: true,
      category: true,
      description: true,
      photoCloudinaryId: true,
      photoBlurRegions: true,
      locationZone: true,
      postedAt: true,
      expiresAt: true,
      status: true,
      finder: {
        select: { id: true, clerkId: true, displayName: true, avatarUrl: true },
      },
      _count: { select: { claims: true } },
    },
  });

  if (!item) throw new NotFoundError("Item");
  return item;
}

export async function deleteItem(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });

  if (!item) throw new NotFoundError("Item");
  if (item.finderId !== userId) throw new ForbiddenError("You can only delete your own items");

  return prisma.item.delete({ where: { id: itemId } });
}

export async function searchItems(filters: SearchItemsInput) {
  const where: Record<string, unknown> = { status: "active" };

  const safeQuery = filters.q ? sanitizePlainText(filters.q) : undefined;
  const safeCategory = filters.category ? sanitizePlainText(filters.category) : undefined;
  const safeLocation = filters.location ? sanitizePlainText(filters.location) : undefined;

  if (safeQuery) {
    where.description = { contains: safeQuery, mode: "insensitive" };
  }

  if (safeCategory) {
    where.category = safeCategory;
  }

  if (safeLocation) {
    where.locationZone = { startsWith: safeLocation };
  }

  if (filters.timeRange && filters.timeRange !== "all") {
    const now = new Date();
    const ranges: Record<string, number> = {
      "1h": 1,
      "24h": 24,
      "7d": 168,
      "30d": 720,
    };
    const hours = ranges[filters.timeRange];
    if (hours) {
      where.postedAt = { gte: new Date(now.getTime() - hours * 60 * 60 * 1000) };
    }
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      select: {
        id: true,
        finderId: true,
        category: true,
        description: true,
        photoCloudinaryId: true,
        photoBlurRegions: true,
        locationZone: true,
        postedAt: true,
        expiresAt: true,
        status: true,
        finder: {
          select: { id: true, clerkId: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { claims: true } },
      },
      orderBy: { postedAt: "desc" },
      skip,
      take: filters.limit,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getMyClaimedItems(userId: string) {
  return prisma.claim.findMany({
    where: {
      loserId: userId,
      status: "approved",
      item: {
        status: { in: ["claimed", "returned"] },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      item: {
        select: {
          id: true,
          finderId: true,
          category: true,
          description: true,
          photoCloudinaryId: true,
          locationZone: true,
          postedAt: true,
          expiresAt: true,
          status: true,
          finder: {
            select: { id: true, clerkId: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function getMyHandoffItems(userId: string) {
  return prisma.item.findMany({
    where: {
      finderId: userId,
      status: "returned",
    },
    orderBy: { postedAt: "desc" },
    select: {
      id: true,
      finderId: true,
      category: true,
      description: true,
      photoCloudinaryId: true,
      locationZone: true,
      postedAt: true,
      expiresAt: true,
      status: true,
      finder: {
        select: { id: true, clerkId: true, displayName: true, avatarUrl: true },
      },
      claims: {
        where: { status: "approved" },
        select: {
          id: true,
          loser: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          finderConfirmedAt: true,
          claimerConfirmedAt: true,
          updatedAt: true,
        },
        take: 1,
      },
    },
  });
}

export async function getPublicAnalytics() {
  const [
    totalItems,
    activeItems,
    claimedItems,
    returnedItems,
    totalClaims,
    pendingClaims,
    approvedClaims,
    topCategories,
    topLocations,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { status: "active" } }),
    prisma.item.count({ where: { status: "claimed" } }),
    prisma.item.count({ where: { status: "returned" } }),
    prisma.claim.count(),
    prisma.claim.count({ where: { status: "pending" } }),
    prisma.claim.count({ where: { status: "approved" } }),
    prisma.item.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
      take: 5,
    }),
    prisma.item.groupBy({
      by: ["locationZone"],
      _count: { locationZone: true },
      orderBy: {
        _count: {
          locationZone: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const handoffCompletionRate = totalItems > 0 ? Number(((returnedItems / totalItems) * 100).toFixed(1)) : 0;
  const claimApprovalRate = totalClaims > 0 ? Number(((approvedClaims / totalClaims) * 100).toFixed(1)) : 0;

  return {
    totals: {
      totalItems,
      activeItems,
      claimedItems,
      returnedItems,
      totalClaims,
      pendingClaims,
      approvedClaims,
      handoffCompletionRate,
      claimApprovalRate,
    },
    topCategories: topCategories.map((entry) => ({
      value: entry.category,
      count: entry._count.category,
    })),
    topLocations: topLocations.map((entry) => ({
      value: entry.locationZone,
      count: entry._count.locationZone,
    })),
  };
}
