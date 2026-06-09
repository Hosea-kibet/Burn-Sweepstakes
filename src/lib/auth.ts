import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

type ParticipantSession = {
  role: "participant";
  email: string;
  exp: number;
};

type AdminSession = {
  role: "admin";
  email: string;
  exp: number;
};

const PARTICIPANT_COOKIE = "sweep_participant_session";
const ADMIN_COOKIE = "sweep_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
}

function signValue(value: string) {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("AUTH_SECRET or DATABASE_URL must be configured.");
  }

  return createHmac("sha256", secret).update(value).digest("base64url");
}

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production";
}

async function readAccountRole(email: string) {
  try {
    return await queryOne<{ is_admin: boolean }>(
      `select is_admin
      from participants
      where email = $1`,
      [email.trim().toLowerCase()],
    );
  } catch {
    return "unknown" as const;
  }
}

function encodeSession(payload: ParticipantSession | AdminSession) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(body);
  return `${body}.${signature}`;
}

function decodeSession<T extends ParticipantSession | AdminSession>(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const [body, signature] = raw.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = signValue(body);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;

  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [salt, saved] = storedHash.split(":");

  if (!salt || !saved) {
    return false;
  }

  const candidate = scryptSync(pin, salt, 64);
  const target = Buffer.from(saved, "hex");

  return timingSafeEqual(candidate, target);
}

export function validatePin(pin: string) {
  const cleaned = pin.trim();

  if (!/^\d{4,8}$/.test(cleaned)) {
    throw new Error("Use a login PIN with 4 to 8 digits.");
  }

  return cleaned;
}

export function setParticipantSession(response: NextResponse, email: string) {
  response.cookies.set(PARTICIPANT_COOKIE, encodeSession({
    role: "participant",
    email,
    exp: Date.now() + SESSION_TTL_MS,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
  });
}

export function setAdminSession(response: NextResponse, email: string) {
  response.cookies.set(ADMIN_COOKIE, encodeSession({
    role: "admin",
    email,
    exp: Date.now() + SESSION_TTL_MS,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
  });
}

export function clearSessions(response: NextResponse) {
  response.cookies.set(PARTICIPANT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0,
  });
}

export async function getParticipantSession() {
  const store = await cookies();
  const raw = store.get(PARTICIPANT_COOKIE)?.value;
  const session = decodeSession<ParticipantSession>(raw);

  if (!session) {
    return null;
  }

  const account = await readAccountRole(session.email);

  if (account === "unknown") {
    return session;
  }

  if (!account || account.is_admin) {
    return null;
  }

  return session;
}

export async function getAdminSession() {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  const session = decodeSession<AdminSession>(raw);

  if (!session) {
    return null;
  }

  const account = await readAccountRole(session.email);

  if (account === "unknown") {
    return session;
  }

  if (!account || !account.is_admin) {
    return null;
  }

  return session;
}

export async function requireParticipantSession() {
  const session = await getParticipantSession();

  if (!session) {
    const adminSession = await getAdminSession();

    if (adminSession) {
      redirect("/admin");
    }

    redirect("/login");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    const participantSession = await getParticipantSession();

    if (participantSession) {
      redirect("/portal");
    }

    redirect("/admin/login");
  }

  return session;
}
