import { z } from "zod";

const SENSITIVE_CATEGORIES = new Set(["electronics", "keys", "id-cards", "bags"]);

export const createItemSchema = z.object({
  category: z.string().min(1, "Category is required").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  secretMarkers: z
    .array(
      z
        .string()
        .trim()
        .min(3, "Each secret marker must be at least 3 characters")
        .max(100, "Each secret marker must be at most 100 characters")
    )
    .min(1, "Add at least one secret marker")
    .max(5, "You can add up to 5 secret markers only"),
  photoCloudinaryId: z.string().min(1, "Photo is required").max(255),
  photoBlurRegions: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
    )
    .optional()
    .nullable(),
  locationZone: z.string().min(1, "Location is required").max(100),
}).superRefine((data, ctx) => {
  if (SENSITIVE_CATEGORIES.has(data.category) && data.secretMarkers.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["secretMarkers"],
      message: "Sensitive categories require at least 2 secret markers",
    });
  }
});

export const searchItemsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  timeRange: z.enum(["1h", "24h", "7d", "30d", "all"]).optional().default("all"),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type SearchItemsInput = z.infer<typeof searchItemsSchema>;
