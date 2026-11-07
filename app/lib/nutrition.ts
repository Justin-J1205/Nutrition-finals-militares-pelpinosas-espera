export type MifflinInput = {
  sex: string;
  ageYears: number;
  weightKg: number;
  heightCm: number;
  activityFactor: number;
};

export function calculateMifflinTargets({
  sex,
  ageYears,
  weightKg,
  heightCm,
  activityFactor,
}: MifflinInput) {
  const sexAdjustment = sex.toLowerCase() === "male" ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexAdjustment;
  const targetCalories = Math.round(bmr * activityFactor);
  const targetProtein = Math.round(weightKg * 1.1);
  const targetCarbs = Math.round((targetCalories * 0.5) / 4);
  const targetFat = Math.round((targetCalories * 0.3) / 9);

  return { bmr: Math.round(bmr), targetCalories, targetProtein, targetCarbs, targetFat };
}

export function getAge(dateOfBirth: Date, now = new Date()) {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
      now.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
