import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "../utils/errors.js";

/**
 * Creates a middleware that validates request body, query, or params against a Zod schema.
 */
export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const messages = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      next(new BadRequestError(`Validation failed: ${messages}`));
      return;
    }

    // Replace with parsed (and transformed) data.
    // Express 5 exposes req.query via a getter, so query must be mutated.
    if (source === "query") {
      Object.keys(req.query).forEach((key) => {
        delete req.query[key];
      });
      Object.assign(req.query, result.data as Record<string, unknown>);
    } else {
      req[source] = result.data;
    }
    next();
  };
}
