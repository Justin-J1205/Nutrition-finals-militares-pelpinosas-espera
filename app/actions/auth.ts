"use server";

import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import type { AuthRole } from "@/app/lib/session";

export async function login(role: "provider" | "patient", userId: string) {
  const expectedEmail =
    role === "provider"
      ? "sarah.jenkins@nutricare.local"
      : role === "patient"
        ? "jane.doe@nutricare.local"
        : null;
  if (!expectedEmail || typeof userId !== "string" || !userId) {
    redirect("/login?error=invalid-demo-user");
  }

  const expectedRole = role.toUpperCase();
  const user = await prisma.user.findFirst({
    where: { id: userId, email: expectedEmail, role: expectedRole },
    select: {
      id: true,
      role: true,
      patientProfile: { select: { id: true } },
    },
  });
  if (
    !user ||
    (role === "patient" && !user.patientProfile) ||
    (role === "provider" && user.patientProfile)
  ) {
    redirect("/login?error=invalid-demo-user");
  }

  const maxAge = 60 * 60 * 8;
  const payload = Buffer.from(
    JSON.stringify({
      role: role as AuthRole,
      userId: user.id,
      expiresAt: Date.now() + maxAge * 1000,
    }),
  ).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set("tele_nutrition_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("tele_nutrition_session");
  redirect("/login");
}

function sign(value: string) {
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "local-development-session-secret-change-before-deploy");
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return createHmac("sha256", secret).update(value).digest("base64url");
}
