import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/clerkAuth.js";
import * as claimService from "../services/claim.service.js";
import { BadRequestError } from "../utils/errors.js";
import type {
  CreateClaimInput,
  CreateClaimMessageInput,
  UpdateClaimStatusInput,
} from "../validators/claim.validator.js";

function getParamAsString(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError(`Invalid ${name}`);
  }
  return value;
}

export async function createClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const itemId = getParamAsString(req.params.itemId, "itemId");
    const claim = await claimService.createClaim(
      itemId,
      dbUser.id,
      req.body as CreateClaimInput
    );

    res.status(201).json({ status: "success", data: claim });
  } catch (error) {
    next(error);
  }
}

export async function getItemClaims(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const itemId = getParamAsString(req.params.itemId, "itemId");
    const claims = await claimService.getClaimsForItem(itemId, dbUser.id);
    res.json({ status: "success", data: claims });
  } catch (error) {
    next(error);
  }
}

export async function getMyItemClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const itemId = getParamAsString(req.params.itemId, "itemId");
    const claim = await claimService.getMyClaimForItem(itemId, dbUser.id);
    res.json({ status: "success", data: claim });
  } catch (error) {
    next(error);
  }
}

export async function updateClaimStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const claimId = getParamAsString(req.params.claimId, "claimId");
    const claim = await claimService.updateClaimStatus(
      claimId,
      dbUser.id,
      req.body as UpdateClaimStatusInput
    );

    res.json({ status: "success", data: claim });
  } catch (error) {
    next(error);
  }
}

export async function getClaimMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const claimId = getParamAsString(req.params.claimId, "claimId");
    const messages = await claimService.getClaimMessages(claimId, dbUser.id);
    res.json({ status: "success", data: messages });
  } catch (error) {
    next(error);
  }
}

export async function createClaimMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const claimId = getParamAsString(req.params.claimId, "claimId");
    const message = await claimService.createClaimMessage(
      claimId,
      dbUser.id,
      req.body as CreateClaimMessageInput
    );

    res.status(201).json({ status: "success", data: message });
  } catch (error) {
    next(error);
  }
}

export async function confirmHandoff(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const claimId = getParamAsString(req.params.claimId, "claimId");
    const claim = await claimService.confirmHandoff(claimId, dbUser.id);
    res.json({ status: "success", data: claim });
  } catch (error) {
    next(error);
  }
}
