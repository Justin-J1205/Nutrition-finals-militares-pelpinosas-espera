import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { calculateMifflinTargets, getAge } from "@/app/lib/nutrition";
import { getSession } from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const patients = await prisma.patientProfile.findMany({
    where: session.role === "patient" ? { userId: session.userId } : undefined,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.role !== "provider") {
    return NextResponse.json({ error: "Provider access required." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { name, email, mrn, dateOfBirth, sex, weightKg, heightCm, activityFactor, diagnosis } = body;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof mrn !== "string" ||
    !mrn.trim() ||
    typeof dateOfBirth !== "string" ||
    Number.isNaN(Date.parse(dateOfBirth)) ||
    typeof sex !== "string" ||
    !["Female", "Male"].includes(sex) ||
    typeof weightKg !== "number" ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    typeof heightCm !== "number" ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0 ||
    typeof activityFactor !== "number" ||
    !Number.isFinite(activityFactor) ||
    activityFactor < 1 ||
    activityFactor > 2.5
  ) {
    return NextResponse.json({ error: "Patient demographics or anthropometrics are invalid." }, { status: 400 });
  }
  const dob = new Date(dateOfBirth);
  const ageYears = getAge(dob);
  if (ageYears < 0 || ageYears > 120) {
    return NextResponse.json({ error: "Date of birth is outside the supported range." }, { status: 400 });
  }
  const targets = calculateMifflinTargets({
    sex,
    ageYears,
    weightKg,
    heightCm,
    activityFactor,
  });

  try {
    const patient = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "PATIENT",
        patientProfile: {
          create: {
            mrn: mrn.trim(),
            dateOfBirth: dob,
            sex,
            diagnosis: typeof diagnosis === "string" ? diagnosis.trim() : "",
            weightKg,
            heightCm,
            activityFactor,
            targetCalories: targets.targetCalories,
            targetProtein: targets.targetProtein,
            targetCarbs: targets.targetCarbs,
            targetFat: targets.targetFat,
          },
        },
      },
      include: { patientProfile: true },
    });
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "A patient with this email or MRN already exists." }, { status: 409 });
    }
    throw error;
  }
}
