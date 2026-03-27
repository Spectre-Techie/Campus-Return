import { Router } from "express";
import { requireAuth } from "../middleware/clerkAuth.js";
import { resolveUser } from "../middleware/clerkAuth.js";
import { claimActionLimiter, uploadLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validator.js";
import { createItemSchema, searchItemsSchema } from "../validators/item.validator.js";
import {
	createClaimSchema,
	itemIdParamSchema,
} from "../validators/claim.validator.js";
import * as itemController from "../controllers/item.controller.js";
import * as claimController from "../controllers/claim.controller.js";

export const itemRouter: ReturnType<typeof Router> = Router();

// Public routes
itemRouter.get("/search", validate(searchItemsSchema, "query"), itemController.searchItems);
itemRouter.get("/analytics", itemController.getPublicAnalytics);

// Protected dashboard routes
itemRouter.get(
	"/my-claimed",
	requireAuth(),
	resolveUser,
	itemController.getMyClaimedItems
);
itemRouter.get(
	"/my-handoffs",
	requireAuth(),
	resolveUser,
	itemController.getMyHandoffItems
);

// Protected claim routes
itemRouter.post(
	"/:itemId/claims",
	claimActionLimiter,
	requireAuth(),
	resolveUser,
	validate(itemIdParamSchema, "params"),
	validate(createClaimSchema),
	claimController.createClaim
);
itemRouter.get(
	"/:itemId/claims",
	requireAuth(),
	resolveUser,
	validate(itemIdParamSchema, "params"),
	claimController.getItemClaims
);
itemRouter.get(
	"/:itemId/my-claim",
	requireAuth(),
	resolveUser,
	validate(itemIdParamSchema, "params"),
	claimController.getMyItemClaim
);

itemRouter.get("/:id", itemController.getItem);

// Protected routes
itemRouter.post(
	"/",
	uploadLimiter,
	requireAuth(),
	resolveUser,
	validate(createItemSchema),
	itemController.createItem
);
itemRouter.delete("/:id", requireAuth(), resolveUser, itemController.deleteItem);
