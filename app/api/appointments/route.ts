import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const requestedPatientId = new URL(request.url).searchParams.get("patientId");
  if (
    session.role === "patient" &&
    requestedPatientId !== null &&
    requestedPatientId !== session.patientId
  ) {
    return NextResponse.json({ error: "You can only view your own appointments." }, { status: 403 });
  }
  const patientId =
    session.role === "patient" ? session.patientId : requestedPatientId;
  const appointments = await prisma.appointment.findMany({
    where: patientId ? { patientId } : undefined,
    include: {
      patient: { include: { user: { select: { name: true } } } },
      provider: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json({ appointments });
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

  const { patientId, scheduledAt } = body;
  if (
    typeof patientId !== "string" ||
    typeof scheduledAt !== "string" ||
    Number.isNaN(Date.parse(scheduledAt))
  ) {
    return NextResponse.json({ error: "A patient and valid appointment time are required." }, { status: 400 });
  }
  const date = new Date(scheduledAt);
  if (date.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Appointment time must be in the future." }, { status: 400 });
  }

  const [patient, provider] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { id: patientId }, select: { id: true } }),
    prisma.user.findFirst({
      where: { id: session.userId, role: "PROVIDER" },
      select: { id: true },
    }),
  ]);
  if (!patient || !provider) {
    return NextResponse.json({ error: "Patient or provider was not found." }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const appointment = await prisma.appointment.create({
    data: {
      id,
      patientId,
      providerId: provider.id,
      scheduledAt: date,
      jitsiRoomId: `nutricare-${id}`,
    },
  });
  return NextResponse.json({ appointment }, { status: 201 });
}
