import { Router } from "express";
import { requireAuth, resolveUser } from "../middleware/clerkAuth.js";
import { notificationLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validator.js";
import {
  notificationIdParamSchema,
  notificationQuerySchema,
} from "../validators/notification.validator.js";
import * as notificationController from "../controllers/notification.controller.js";

export const notificationRouter: ReturnType<typeof Router> = Router();

notificationRouter.get(
  "/",
  notificationLimiter,
  requireAuth(),
  resolveUser,
  validate(notificationQuerySchema, "query"),
  notificationController.getMyNotifications
);

notificationRouter.patch(
  "/read-all",
  notificationLimiter,
  requireAuth(),
  resolveUser,
  notificationController.markAllNotificationsRead
);

notificationRouter.patch(
  "/:notificationId/read",
  notificationLimiter,
  requireAuth(),
  resolveUser,
  validate(notificationIdParamSchema, "params"),
  notificationController.markNotificationRead
);
