import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export const runtime = "nodejs";

const problemCodes = new Set(["NI-5.4", "NI-2.1", "NC-2.2", "NB-1.1", "NI-5.1", "NC-3.3"]);
const noteFields = ["etiology", "signs", "assessment", "intervention", "monitoring"] as const;
type NoteTextField = (typeof noteFields)[number];
type AdimeRequest = Record<NoteTextField | "patientId" | "problemCode", string>;

function isNonEmptyNoteText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 5000;
}

function isAdimeRequest(body: Record<string, unknown>): body is AdimeRequest {
  return (
    typeof body.patientId === "string" &&
    body.patientId.length > 0 &&
    typeof body.problemCode === "string" &&
    problemCodes.has(body.problemCode) &&
    noteFields.every((field) => isNonEmptyNoteText(body[field]))
  );
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.role !== "provider") {
    return NextResponse.json({ error: "Provider access required." }, { status: 403 });
  }

  const patientId = new URL(request.url).searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }
  const note = await prisma.adimeNote.findUnique({
    where: { patientId_providerId: { patientId, providerId: session.userId } },
  });
  return NextResponse.json({ note });
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
  if (!isAdimeRequest(body)) {
    return NextResponse.json({ error: "Provide a valid patient and complete ADIME note." }, { status: 400 });
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { id: body.patientId },
    select: { id: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const content = {
    etiology: body.etiology.trim(),
    signs: body.signs.trim(),
    assessment: body.assessment.trim(),
    intervention: body.intervention.trim(),
    monitoring: body.monitoring.trim(),
  };
  const note = await prisma.adimeNote.upsert({
    where: {
      patientId_providerId: {
        patientId: body.patientId,
        providerId: session.userId,
      },
    },
    create: {
      patientId: body.patientId,
      providerId: session.userId,
      problemCode: body.problemCode,
      ...content,
    },
    update: { problemCode: body.problemCode, ...content },
  });
  return NextResponse.json({ note });
}
