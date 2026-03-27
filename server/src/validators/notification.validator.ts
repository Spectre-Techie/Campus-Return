import { z } from "zod";

export const notificationQuerySchema = z.object({
  unreadOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid("Invalid notification id"),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
