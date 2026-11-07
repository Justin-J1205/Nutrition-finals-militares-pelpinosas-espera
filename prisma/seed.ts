import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const provider = await prisma.user.upsert({
    where: { email: "sarah.jenkins@nutricare.local" },
    update: {},
    create: {
      name: "Sarah Jenkins, MS, RD, LDN",
      email: "sarah.jenkins@nutricare.local",
      role: "PROVIDER",
    },
  });

  const jane = await prisma.user.upsert({
    where: { email: "jane.doe@nutricare.local" },
    update: {},
    create: {
      name: "Jane Doe",
      email: "jane.doe@nutricare.local",
      role: "PATIENT",
      patientProfile: {
        create: {
          mrn: "MRN-4892-90214",
          dateOfBirth: new Date("1968-04-12T00:00:00.000Z"),
          sex: "Female",
          diagnosis: "Type 2 Diabetes, Stage 1 HTN",
          weightKg: 78.5,
          heightCm: 165,
          activityFactor: 1.375,
          targetCalories: 1750,
          targetProtein: 86,
          targetCarbs: 219,
          targetFat: 58,
          meals: {
            create: [
              {
                type: "Breakfast",
                description: "Oatmeal with sliced almonds & banana",
                kcal: 350,
                protein: 12,
                carbs: 58,
                fat: 8,
                sodium: 140,
              },
              {
                type: "Lunch",
                description: "Canned Chicken Noodle Soup & Salted Crackers",
                kcal: 520,
                protein: 22,
                carbs: 64,
                fat: 16,
                sodium: 1540,
              },
              {
                type: "Dinner",
                description: "Teriyaki Salmon with White Rice & Soy Sauce",
                kcal: 680,
                protein: 36,
                carbs: 75,
                fat: 22,
                sodium: 770,
              },
            ],
          },
        },
      },
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria.garcia@nutricare.local" },
    update: {},
    create: {
      name: "Maria Garcia",
      email: "maria.garcia@nutricare.local",
      role: "PATIENT",
      patientProfile: {
        create: {
          mrn: "MRN-8841-77319",
          dateOfBirth: new Date("1942-11-03T00:00:00.000Z"),
          sex: "Female",
          diagnosis: "Protein-Calorie Malnutrition / Elderly",
          weightKg: 49,
          heightCm: 158,
          targetCalories: 1600,
          targetProtein: 75,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "robert.smith@nutricare.local" },
    update: {},
    create: {
      name: "Robert Smith",
      email: "robert.smith@nutricare.local",
      role: "PATIENT",
      patientProfile: {
        create: {
          mrn: "MRN-1120-44102",
          dateOfBirth: new Date("1955-09-24T00:00:00.000Z"),
          sex: "Male",
          diagnosis: "Chronic Kidney Disease (Stage 3)",
          weightKg: 82,
          heightCm: 175,
          activityFactor: 1.2,
          targetCalories: 1850,
          targetProtein: 65,
        },
      },
    },
  });

  void jane;
  void maria;
  void provider;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
