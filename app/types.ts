export type Patient = {
  id: string;
  userId: string;
  mrn: string;
  dateOfBirth: string;
  sex: string;
  diagnosis: string;
  weightKg: number;
  heightCm: number;
  activityFactor: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  user: { id: string; name: string; email: string };
};

export type Meal = {
  id: string;
  patientId: string;
  type: string;
  description: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  loggedAt: string;
};

export type NutritionTotals = Pick<
  Meal,
  "kcal" | "protein" | "carbs" | "fat" | "sodium"
>;

export type CdsAlert = {
  code: string;
  severity: "high" | "warning";
  message: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  providerId: string;
  scheduledAt: string;
  jitsiRoomId: string;
  status: string;
  provider?: { name: string };
};

export type TabId =
  | "workflow"
  | "meallog"
  | "encpt"
  | "telehealth"
  | "fhir"
  | "heuristics";

export type AuthRole = "provider" | "patient";
