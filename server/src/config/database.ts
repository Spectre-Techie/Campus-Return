import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrlWithPoolDefaults(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);

    // Supabase transaction pooler commonly uses port 6543. If DATABASE_URL
    // points to the pooler host on 5432, route it to 6543 automatically.
    if (parsed.hostname.endsWith("pooler.supabase.com") && parsed.port === "5432") {
      parsed.port = "6543";
    }

    if (parsed.hostname.endsWith("pooler.supabase.com") && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }

    const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT ?? "5";
    const poolTimeout = process.env.DATABASE_POOL_TIMEOUT ?? "45";

    // Keep existing explicit settings, otherwise apply safer defaults for API workloads.
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", connectionLimit);
    }

    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", poolTimeout);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

const resolvedDatabaseUrl = resolveDatabaseUrlWithPoolDefaults(process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  ...(resolvedDatabaseUrl ? { datasources: { db: { url: resolvedDatabaseUrl } } } : {}),
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
