import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

function isPoolTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  if ("code" in error && (error as { code?: string }).code === "P2024") {
    return true;
  }

  const message = "message" in error ? (error as { message?: unknown }).message : undefined;
  return (
    typeof message === "string" &&
    message.includes("Timed out fetching a new connection from the connection pool")
  );
}

async function retryOnceOnPoolTimeout<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isPoolTimeoutError(error)) throw error;

    await new Promise((resolve) => setTimeout(resolve, 200));
    return operation();
  }
}

/**
 * Clerk middleware -- attaches auth info to every request.
 * Must be applied before any route that needs auth.
 */
export { clerkMiddleware, requireAuth };

/**
 * Resolves the Clerk userId to our internal database User.
 * Attaches `req.dbUser` with the full user record.
 * Use AFTER `requireAuth()` on protected routes.
 */
export async function resolveUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      throw new UnauthorizedError("No authenticated user");
    }

    let user = await retryOnceOnPoolTimeout(() =>
      prisma.user.findUnique({
        where: { clerkId: auth.userId },
      })
    );

    if (!user) {
      const claims = auth.sessionClaims as Record<string, unknown> | undefined;
      const emailValue = claims?.email ?? claims?.email_address;
      const firstNameValue = claims?.first_name ?? claims?.given_name;
      const lastNameValue = claims?.last_name ?? claims?.family_name;
      const imageValue = claims?.image_url ?? claims?.picture;

      // Some Clerk session token payloads may omit email claims depending on flow/config.
      // Use a deterministic fallback so local development does not fail on first protected action.
      const resolvedEmail =
        typeof emailValue === "string" && emailValue.length > 0
          ? emailValue
          : `${auth.userId}@clerk.local`;

      const displayName = [firstNameValue, lastNameValue]
        .filter((part): part is string => typeof part === "string" && part.length > 0)
        .join(" ")
        .slice(0, 30) || null;

      user = await retryOnceOnPoolTimeout(() =>
        prisma.user.upsert({
          where: { clerkId: auth.userId },
          create: {
            clerkId: auth.userId,
            email: resolvedEmail,
            displayName,
            avatarUrl: typeof imageValue === "string" ? imageValue : null,
          },
          update: {
            email: resolvedEmail,
            displayName,
            avatarUrl: typeof imageValue === "string" ? imageValue : null,
            deletedAt: null,
          },
        })
      );
    }

    // Attach to request for downstream use
    (req as AuthenticatedRequest).dbUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Requires the resolved user to be an admin.
 * Use AFTER `resolveUser` middleware.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).dbUser;

  if (!user?.isAdmin) {
    next(new ForbiddenError("Admin access required"));
    return;
  }

  next();
}

// Type augmentation for authenticated requests
export interface AuthenticatedRequest extends Request {
  dbUser: {
    id: string;
    clerkId: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    isAdmin: boolean;
    flagCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
}
