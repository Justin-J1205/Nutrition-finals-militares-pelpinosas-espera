import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export type AuthRole = "provider" | "patient";

export type Session =
  | { role: "provider"; userId: string; patientId: null }
  | { role: "patient"; userId: string; patientId: string };

const COOKIE_NAME = "tele_nutrition_session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "local-development-session-secret-change-before-deploy");
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }

  if (!isSessionPayload(parsed) || parsed.expiresAt <= Date.now()) return null;

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      role: true,
      patientProfile: { select: { id: true } },
    },
  });
  if (!user || user.role !== parsed.role.toUpperCase()) {
    return null;
  }

  if (parsed.role === "patient") {
    return user.patientProfile
      ? { role: "patient", userId: parsed.userId, patientId: user.patientProfile.id }
      : null;
  }
  return user.patientProfile
    ? null
    : { role: "provider", userId: parsed.userId, patientId: null };
}

function isSessionPayload(value: unknown): value is {
  role: AuthRole;
  userId: string;
  expiresAt: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    "userId" in value &&
    "expiresAt" in value &&
    (value.role === "provider" || value.role === "patient") &&
    typeof value.userId === "string" &&
    typeof value.expiresAt === "number" &&
    Number.isSafeInteger(value.expiresAt)
  );
}
