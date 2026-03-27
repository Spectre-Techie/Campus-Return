import { Router, raw } from "express";
import { Webhook } from "svix";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const webhookRouter: ReturnType<typeof Router> = Router();

interface ClerkUserEventData {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserEventData;
}

/**
 * Clerk webhook endpoint.
 * Syncs user creation/updates from Clerk into our PostgreSQL database.
 *
 * Uses raw body parser (not JSON) because Svix needs the raw payload
 * for signature verification.
 */
webhookRouter.post(
  "/clerk",
  raw({ type: "application/json" }),
  async (req, res) => {
    const svixId = req.headers["svix-id"] as string;
    const svixTimestamp = req.headers["svix-timestamp"] as string;
    const svixSignature = req.headers["svix-signature"] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: "Missing Svix headers" });
      return;
    }

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let event: ClerkWebhookEvent;

    try {
      event = wh.verify(req.body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      logger.warn({ err }, "Clerk webhook signature verification failed");
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const { type, data } = event;

    try {
      switch (type) {
        case "user.created":
        case "user.updated": {
          const primaryEmail = data.email_addresses[0]?.email_address;

          if (!primaryEmail) {
            logger.warn({ clerkId: data.id }, "Webhook user has no email");
            res.status(200).json({ received: true });
            return;
          }

          const displayName = [data.first_name, data.last_name]
            .filter(Boolean)
            .join(" ")
            .slice(0, 30) || null;

          await prisma.user.upsert({
            where: { clerkId: data.id },
            create: {
              clerkId: data.id,
              email: primaryEmail,
              displayName,
              avatarUrl: data.image_url,
            },
            update: {
              email: primaryEmail,
              displayName,
              avatarUrl: data.image_url,
            },
          });

          logger.info({ clerkId: data.id, type }, "User synced from Clerk");
          break;
        }

        case "user.deleted": {
          await prisma.user.update({
            where: { clerkId: data.id },
            data: { deletedAt: new Date() },
          });

          logger.info({ clerkId: data.id }, "User soft-deleted from Clerk webhook");
          break;
        }

        default:
          logger.debug({ type }, "Unhandled Clerk webhook event type");
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ error, type, clerkId: data.id }, "Error processing Clerk webhook");
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);
