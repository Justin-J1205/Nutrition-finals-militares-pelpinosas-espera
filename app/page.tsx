import { NutritionDashboard } from "@/app/components/NutritionDashboard";
import { getSession } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { name: true },
  });

  return (
    <NutritionDashboard
      role={session.role}
      userId={session.userId}
      patientId={session.patientId}
      userName={user.name}
    />
  );
}
