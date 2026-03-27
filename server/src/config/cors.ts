import { env } from "./env.js";

const PRODUCTION_VERCEL_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/campus-return\.vercel\.app$/,
  /^https:\/\/campus-return(?:-[a-z0-9-]+)?-outstandingteam-projects\.vercel\.app$/,
];

function normalizeOrigins(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const configuredOrigins = [env.FRONTEND_URL, ...normalizeOrigins(env.CORS_ALLOWED_ORIGINS)];
const uniqueConfiguredOrigins = Array.from(new Set(configuredOrigins));

function isAllowedByPattern(origin: string): boolean {
  return PRODUCTION_VERCEL_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (uniqueConfiguredOrigins.includes(origin)) return true;
  if (env.NODE_ENV === "production" && isAllowedByPattern(origin)) return true;
  return false;
}

export function getAllowedOrigins(): string[] {
  return uniqueConfiguredOrigins;
}
