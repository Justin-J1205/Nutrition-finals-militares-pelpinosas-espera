"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { Meal, NutritionTotals, Patient } from "@/app/types";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

type AdimeChartProps = {
  patient: Patient;
  meals: Meal[];
  totals: NutritionTotals;
};

export function AdimeChart({ patient, meals, totals }: AdimeChartProps) {
  const macroData = {
    labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
    datasets: [
      {
        data: [totals.protein, totals.carbs, totals.fat],
        backgroundColor: ["#0d9488", "#3b82f6", "#f59e0b"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };
  const comparisonData = {
    labels: ["Calories (kcal)", "Protein (g)", "Sodium (mg/10)"],
    datasets: [
      {
        label: "Target RDA",
        data: [patient.targetCalories, patient.targetProtein, 200],
        backgroundColor: "#cbd5e1",
      },
      {
        label: "Logged Intake",
        data: [totals.kcal, totals.protein, Math.round(totals.sodium / 10)],
        backgroundColor: "#0f766e",
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 11, family: "Inter" } },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Macronutrient Intake</h3>
        <div className="h-64">
          {meals.length ? (
            <Doughnut data={macroData} options={chartOptions} />
          ) : (
            <EmptyChart />
          )}
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Target vs. Today's Intake</h3>
        <div className="h-64">
          {meals.length ? (
            <Bar
              data={comparisonData}
              options={{
                ...chartOptions,
                scales: { y: { beginAtZero: true } },
              }}
            />
          ) : (
            <EmptyChart />
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
      Log a meal to view intake charts.
    </div>
  );
}
