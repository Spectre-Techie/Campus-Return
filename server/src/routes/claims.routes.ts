import { Router } from "express";
import { requireAuth, resolveUser } from "../middleware/clerkAuth.js";
import { claimActionLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validator.js";
import {
  claimIdParamSchema,
  confirmHandoffSchema,
  createClaimMessageSchema,
  updateClaimStatusSchema,
} from "../validators/claim.validator.js";
import * as claimController from "../controllers/claim.controller.js";

export const claimRouter: ReturnType<typeof Router> = Router();

claimRouter.patch(
  "/:claimId",
  claimActionLimiter,
  requireAuth(),
  resolveUser,
  validate(claimIdParamSchema, "params"),
  validate(updateClaimStatusSchema),
  claimController.updateClaimStatus
);

claimRouter.get(
  "/:claimId/messages",
  requireAuth(),
  resolveUser,
  validate(claimIdParamSchema, "params"),
  claimController.getClaimMessages
);

claimRouter.post(
  "/:claimId/messages",
  claimActionLimiter,
  requireAuth(),
  resolveUser,
  validate(claimIdParamSchema, "params"),
  validate(createClaimMessageSchema),
  claimController.createClaimMessage
);

claimRouter.patch(
  "/:claimId/confirm-handoff",
  claimActionLimiter,
  requireAuth(),
  resolveUser,
  validate(claimIdParamSchema, "params"),
  validate(confirmHandoffSchema),
  claimController.confirmHandoff
);
