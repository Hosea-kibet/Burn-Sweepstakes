import "server-only";
import { neon, type QueryResultRow } from "@neondatabase/serverless";

type QueryResponse<T> = {
  rows: T[];
};

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  return value ? value : undefined;
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSql() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error("Database is not configured. Add DATABASE_URL.");
  }

  return neon(connectionString);
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResponse<T>> {
  try {
    return (await getSql().query(text, params, {
      fullResults: true,
    })) as QueryResponse<T>;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error.";

    throw new Error(
      `Unable to reach the database. Check DATABASE_URL, confirm the Neon project is reachable, and restart the Next.js server after env changes. Original error: ${message}`,
    );
  }
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}
