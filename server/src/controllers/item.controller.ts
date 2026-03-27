import type { Request, Response, NextFunction } from "express";
import * as itemService from "../services/item.service.js";
import type { AuthenticatedRequest } from "../middleware/clerkAuth.js";
import { BadRequestError } from "../utils/errors.js";
import {
  searchItemsSchema,
  type CreateItemInput,
  type SearchItemsInput,
} from "../validators/item.validator.js";

function getParamAsString(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError(`Invalid ${name}`);
  }
  return value;
}

export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const item = await itemService.createItem(dbUser.id, req.body as CreateItemInput);
    res.status(201).json({ status: "success", data: item });
  } catch (error) {
    next(error);
  }
}

export async function getItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getParamAsString(req.params.id, "id");
    const item = await itemService.getItemById(id);
    res.json({ status: "success", data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const id = getParamAsString(req.params.id, "id");
    await itemService.deleteItem(id, dbUser.id);
    res.json({ status: "success", message: "Item deleted" });
  } catch (error) {
    next(error);
  }
}

export async function searchItems(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedFilters = searchItemsSchema.parse(req.query) as SearchItemsInput;
    const result = await itemService.searchItems(parsedFilters);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMyClaimedItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const items = await itemService.getMyClaimedItems(dbUser.id);
    res.json({ status: "success", data: items });
  } catch (error) {
    next(error);
  }
}

export async function getMyHandoffItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { dbUser } = req as AuthenticatedRequest;
    const items = await itemService.getMyHandoffItems(dbUser.id);
    res.json({ status: "success", data: items });
  } catch (error) {
    next(error);
  }
}

export async function getPublicAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const analytics = await itemService.getPublicAnalytics();
    res.json({ status: "success", data: analytics });
  } catch (error) {
    next(error);
  }
}
