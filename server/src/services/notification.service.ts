import { prisma } from "../config/database.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import type { NotificationQueryInput } from "../validators/notification.validator.js";

export async function listNotifications(userId: string, query: NotificationQueryInput) {
  const take = Number.isFinite(query.limit) ? Math.max(1, Math.min(50, Number(query.limit))) : 20;

  return prisma.notification.findMany({
    where: {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      relatedItemId: true,
      content: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true, readAt: true },
  });

  if (!notification) throw new NotFoundError("Notification");
  if (notification.userId !== userId) {
    throw new ForbiddenError("You can only update your own notifications");
  }

  if (notification.readAt) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        type: true,
        relatedItemId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    });
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
    select: {
      id: true,
      type: true,
      relatedItemId: true,
      content: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return { updated: result.count };
}
