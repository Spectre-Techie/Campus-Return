import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/clerkAuth.js";
import * as notificationService from "../services/notification.service.js";
import { notificationQuerySchema } from "../validators/notification.validator.js";

export async function getMyNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const query = notificationQuerySchema.parse(req.query);
    const notifications = await notificationService.listNotifications(
      dbUser.id,
      query
    );

    res.json({ status: "success", data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const notification = await notificationService.markNotificationRead(
      req.params.notificationId as string,
      dbUser.id
    );

    res.json({ status: "success", data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const result = await notificationService.markAllNotificationsRead(dbUser.id);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
}
