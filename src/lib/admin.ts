import "server-only";

export function verifyAdminToken(token: string | null) {
  const expected = process.env.ADMIN_DRAW_TOKEN;

  if (!expected) {
    throw new Error("ADMIN_DRAW_TOKEN is not configured.");
  }

  return Boolean(token && token === expected);
}

export function assertAdminToken(token: string | null) {
  if (!verifyAdminToken(token)) {
    const error = new Error("Invalid admin token.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
}
