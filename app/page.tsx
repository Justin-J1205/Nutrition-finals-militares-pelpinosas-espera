import { NutritionDashboard } from "@/app/components/NutritionDashboard";
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <NutritionDashboard
      role={session.role}
      userId={session.userId}
      patientId={session.patientId}
    />
  );
}
