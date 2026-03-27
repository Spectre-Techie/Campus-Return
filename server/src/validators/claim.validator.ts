import { z } from "zod";

export const itemIdParamSchema = z.object({
  itemId: z.string().uuid("Invalid item id"),
});

export const claimIdParamSchema = z.object({
  claimId: z.string().uuid("Invalid claim id"),
});

export const createClaimSchema = z
  .object({
    ownershipSignals: z
      .array(
        z
          .string()
          .trim()
          .min(3, "Each ownership signal must be at least 3 characters")
          .max(120, "Each ownership signal must be at most 120 characters")
      )
      .min(2, "Provide at least 2 ownership signals")
      .max(4, "Provide up to 4 ownership signals")
      .optional(),
    verificationAttempt: z
      .string()
      .trim()
      .min(10, "Verification details must be at least 10 characters")
      .max(600, "Verification details must be at most 600 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasLegacyText = Boolean(data.verificationAttempt && data.verificationAttempt.length > 0);
    const hasStructuredSignals = Boolean(data.ownershipSignals && data.ownershipSignals.length >= 2);

    if (!hasLegacyText && !hasStructuredSignals) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ownershipSignals"],
        message: "Provide at least 2 ownership signals",
      });
    }
  });

export const updateClaimStatusSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const createClaimMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(1000, "Message must be at most 1000 characters"),
});

export const confirmHandoffSchema = z.object({
  confirm: z.literal(true),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;
export type CreateClaimMessageInput = z.infer<typeof createClaimMessageSchema>;
