import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const patientId = params.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }
  if (session.role === "patient" && patientId !== session.patientId) {
    return NextResponse.json({ error: "You can only export your own record." }, { status: 403 });
  }
  const piiMasked =
    session.role === "patient" || params.get("piiMasked") !== "false";
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: { user: true, meals: { orderBy: { loggedAt: "desc" } } },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const patientName = piiMasked ? "Patient" : patient.user.name;
  const bundle = {
    resourceType: "Bundle",
    id: `tele-nutrition-bundle-${patient.id}`,
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: patient.id,
          identifier: [
            {
              system: "urn:oid:1.2.36.146",
              value: piiMasked ? `MRN-****-${patient.mrn.slice(-5)}` : patient.mrn,
            },
          ],
          name: [{ text: patientName }],
          gender: patient.sex.toLowerCase(),
          birthDate: piiMasked
            ? patient.dateOfBirth.toISOString().slice(0, 4)
            : patient.dateOfBirth.toISOString().slice(0, 10),
        },
      },
      {
        resource: {
          resourceType: "NutritionOrder",
          id: `nutrition-order-${patient.id}`,
          status: "active",
          patient: { reference: `Patient/${patient.id}` },
          dateTime: new Date().toISOString(),
          oralDiet: {
            nutrient: [
              {
                modifier: {
                  text: `Daily target: ${patient.targetCalories} kcal; sodium limit < 2,000 mg`,
                },
              },
            ],
          },
        },
      },
      ...patient.meals.map((meal) => ({
        resource: {
          resourceType: "Observation",
          id: meal.id,
          status: "final",
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "social-history",
                  display: "Nutrition intake",
                },
              ],
            },
          ],
          code: {
            text: `${meal.type}: ${meal.description}`,
          },
          subject: { reference: `Patient/${patient.id}` },
          effectiveDateTime: meal.loggedAt.toISOString(),
          component: [
            { code: { text: "Energy" }, valueQuantity: { value: meal.kcal, unit: "kcal" } },
            { code: { text: "Protein" }, valueQuantity: { value: meal.protein, unit: "g" } },
            { code: { text: "Carbohydrate" }, valueQuantity: { value: meal.carbs, unit: "g" } },
            { code: { text: "Fat" }, valueQuantity: { value: meal.fat, unit: "g" } },
            { code: { text: "Sodium" }, valueQuantity: { value: meal.sodium, unit: "mg" } },
          ],
        },
      })),
    ],
  };

  return NextResponse.json(bundle, {
    headers: { "Content-Type": "application/fhir+json; charset=utf-8" },
  });
}
