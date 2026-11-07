import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export const runtime = "nodejs";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const searchParams = new URL(request.url).searchParams;
  const patientId = searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }
  if (session.role === "patient" && patientId !== session.patientId) {
    return NextResponse.json({ error: "You can only view your own meal records." }, { status: 403 });
  }
  const date = searchParams.get("date");
  const offsetParam = searchParams.get("timezoneOffset");
  const offset = offsetParam === null ? 0 : Number(offsetParam);
  if (
    (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) ||
    !Number.isInteger(offset) ||
    offset < -840 ||
    offset > 840
  ) {
    return NextResponse.json({ error: "The requested meal date or timezone is invalid." }, { status: 400 });
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true, targetProtein: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const day = date ?? new Date().toISOString().slice(0, 10);
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, dayOfMonth);
  if (new Date(utcMidnight).toISOString().slice(0, 10) !== day) {
    return NextResponse.json({ error: "The requested meal date is invalid." }, { status: 400 });
  }
  const dayStart = new Date(utcMidnight + offset * 60_000);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const meals = await prisma.mealLog.findMany({
    where: { patientId, loggedAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { loggedAt: "desc" },
  });
  const totals = meals.reduce(
    (sum, meal) => ({
      kcal: sum.kcal + meal.kcal,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
      sodium: sum.sodium + meal.sodium,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
  );
  const alerts = [];
  if (totals.sodium > 2000) {
    alerts.push({
      code: "HIGH_SODIUM",
      severity: "high",
      message: `Today's sodium intake is ${totals.sodium} mg, above the 2,000 mg daily threshold.`,
    });
  }
  if (
    meals.length > 0 &&
    totals.protein < profile.targetProtein * 0.7
  ) {
    alerts.push({
      code: "LOW_PROTEIN",
      severity: "warning",
      message: `Today's protein intake is ${totals.protein} g, below 70% of the ${profile.targetProtein} g target.`,
    });
  }

  return NextResponse.json({ meals, totals, alerts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { patientId, type, description, kcal, protein, carbs, fat, sodium } = body;
  if (
    session.role === "patient" &&
    (typeof patientId !== "string" || patientId !== session.patientId)
  ) {
    return NextResponse.json({ error: "You can only log meals to your own record." }, { status: 403 });
  }
  if (
    typeof patientId !== "string" ||
    typeof type !== "string" ||
    !type.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !isNonNegativeNumber(kcal) ||
    !Number.isInteger(kcal) ||
    !isNonNegativeNumber(protein) ||
    !isNonNegativeNumber(carbs) ||
    !isNonNegativeNumber(fat) ||
    !isNonNegativeNumber(sodium) ||
    !Number.isInteger(sodium)
  ) {
    return NextResponse.json(
      { error: "Provide a patient, meal type, description, and valid non-negative nutrition values." },
      { status: 400 },
    );
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const meal = await prisma.mealLog.create({
    data: {
      patientId,
      type: type.trim(),
      description: description.trim(),
      kcal,
      protein,
      carbs,
      fat,
      sodium,
    },
  });

  return NextResponse.json({ meal }, { status: 201 });
}
