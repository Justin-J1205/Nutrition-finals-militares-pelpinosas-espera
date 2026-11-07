"use client";

import { useState, type FormEvent } from "react";
import type { CdsAlert, Meal, Patient } from "@/app/types";

type MealLogFormProps = {
  patient: Patient;
  meals: Meal[];
  alerts: CdsAlert[];
  onMealLogged: () => Promise<void>;
};

export function MealLogForm({ patient, meals, alerts, onMealLogged }: MealLogFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = {
      patientId: patient.id,
      type: String(fields.get("type") || ""),
      description: String(fields.get("description") || ""),
      kcal: Number(fields.get("kcal")),
      protein: Number(fields.get("protein")),
      carbs: Number(fields.get("carbs")),
      fat: Number(fields.get("fat")),
      sodium: Number(fields.get("sodium")),
    };

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save meal.");
      form.reset();
      setSuccess("Meal saved. Today's totals and clinical checks have been updated.");
      try {
        await onMealLogged();
      } catch {
        setError("Meal saved, but the latest totals could not be refreshed. Refresh the page to see them.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save meal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="flex items-center space-x-2 text-base font-bold text-slate-900">
          <i className="fa-solid fa-utensils text-teal-600" aria-hidden="true" />
          <span>Meal Logging &amp; Clinical Decision Support</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Record dietary telemetry for {patient.user.name} and review database-evaluated safety rules.
        </p>
      </header>

      <section aria-live="polite" className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex items-center space-x-2 rounded-r-xl border-l-4 border-emerald-500 bg-emerald-50 p-3 text-xs text-emerald-800">
            <i className={`fa-solid ${meals.length ? "fa-circle-check text-emerald-600" : "fa-circle-info text-teal-700"}`} aria-hidden="true" />
            <span>
              {meals.length
                ? "Today's logged intake is within the configured clinical thresholds."
                : "No meals are logged today. Add your first meal to start today's intake checks."}
            </span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.code}
              className={`flex items-start justify-between rounded-r-xl border-l-4 p-4 shadow-xs ${
                alert.severity === "high"
                  ? "border-red-500 bg-red-50 text-red-900"
                  : "border-amber-500 bg-amber-50 text-amber-900"
              }`}
            >
              <div className="flex items-start space-x-3">
                <i
                  className={`fa-solid ${
                    alert.severity === "high"
                      ? "fa-triangle-exclamation text-red-600"
                      : "fa-circle-exclamation text-amber-600"
                  } mt-0.5 text-lg`}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    {alert.code === "HIGH_SODIUM"
                      ? "CDS Safety Trigger: Excessive Sodium Intake"
                      : "CDS Clinical Warning: Protein Intake Deficit"}
                  </h3>
                  <p className="mt-1 text-xs">{alert.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form onSubmit={submitMeal} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Log a meal</h3>
            <p className="mt-1 text-xs text-slate-500">Enter the nutrition values from the food label or your best estimate.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <div>
              <label htmlFor="meal-description" className="mb-1 block text-xs font-semibold text-slate-600">
                Food or meal
              </label>
              <input
                id="meal-description"
                name="description"
                required
                maxLength={240}
                placeholder="e.g. Oatmeal with berries"
                className="w-full rounded border border-slate-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="meal-type" className="mb-1 block text-xs font-semibold text-slate-600">
                Meal type
              </label>
              <select id="meal-type" name="type" className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100">
                {["Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-700">Nutrition information</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["kcal", "Calories", "kcal"],
                ["protein", "Protein", "g"],
                ["carbs", "Carbohydrate", "g"],
                ["fat", "Fat", "g"],
                ["sodium", "Sodium", "mg"],
              ].map(([name, label, value]) => (
                <div key={name}>
                  <label htmlFor={`meal-${name}`} className="mb-1 block text-xs font-semibold text-slate-600">
                    {label} <span className="font-normal text-slate-500">({value})</span>
                  </label>
                  <input
                    id={`meal-${name}`}
                    name={name}
                    type="number"
                    min="0"
                    step={name === "kcal" || name === "sodium" ? "1" : "0.1"}
                    required
                    placeholder="0"
                    className="w-full rounded border border-slate-300 px-3 py-2.5 font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
          {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{success}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-plus mr-2" aria-hidden="true" />
            {busy ? "Saving meal..." : "Save meal to patient record"}
          </button>
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Today's meal log</h3>
            <span className="rounded bg-teal-50 px-2 py-1 font-mono text-[11px] text-teal-700">
              {meals.length} entries
            </span>
          </div>
          {meals.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-xs text-slate-500">
              No meals recorded for today. Use the form to add breakfast, lunch, dinner, or a snack.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {meals.map((meal) => (
                <article key={meal.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{meal.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {meal.type} · {new Date(meal.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-600">
                    <span>{meal.kcal} kcal</span>
                    <span>{meal.protein}g protein</span>
                    <span className={meal.sodium > 1000 ? "font-bold text-red-600" : ""}>
                      {meal.sodium}mg sodium
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
