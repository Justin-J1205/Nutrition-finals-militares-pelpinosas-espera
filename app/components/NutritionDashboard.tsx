"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdimeChart } from "@/app/components/AdimeChart";
import { DashboardMetrics } from "@/app/components/DashboardMetrics";
import { FhirExport } from "@/app/components/FhirExport";
import { Header } from "@/app/components/Header";
import { Heuristics } from "@/app/components/Heuristics";
import { JitsiTelehealth } from "@/app/components/JitsiTelehealth";
import { MealLogForm } from "@/app/components/MealLogForm";
import { WorkflowStepper } from "@/app/components/WorkflowStepper";
import type { AuthRole } from "@/app/types";
import type {
  CdsAlert,
  Meal,
  NutritionTotals,
  Patient,
  TabId,
} from "@/app/types";

const emptyTotals: NutritionTotals = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sodium: 0,
};

type NutritionDashboardProps = {
  role: AuthRole;
  userId: string;
  patientId: string | null;
};

export function NutritionDashboard({
  role,
  userId,
  patientId: sessionPatientId,
}: NutritionDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(sessionPatientId ?? "");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<NutritionTotals>(emptyTotals);
  const [alerts, setAlerts] = useState<CdsAlert[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("workflow");
  const [piiMasked, setPiiMasked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const patient = useMemo(
    () => patients.find((item) => item.id === patientId) ?? null,
    [patients, patientId],
  );
  const initialPatientId = sessionPatientId ?? "";

  const refreshMeals = useCallback(async () => {
    if (!patientId) return;
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const query = new URLSearchParams({
      patientId,
      date: today,
      timezoneOffset: String(now.getTimezoneOffset()),
    });
    const response = await fetch(`/api/meals?${query}`);
    const result = (await response.json()) as {
      meals?: Meal[];
      totals?: NutritionTotals;
      alerts?: CdsAlert[];
      error?: string;
    };
    if (!response.ok) throw new Error(result.error || "Unable to load meal records.");
    setMeals(result.meals ?? []);
    setTotals(result.totals ?? emptyTotals);
    setAlerts(result.alerts ?? []);
  }, [patientId]);

  useEffect(() => {
    let active = true;
    fetch("/api/patients")
      .then(async (response) => {
        const result = (await response.json()) as {
          patients?: Patient[];
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || "Unable to load patients.");
        if (!active) return;
        const available = result.patients ?? [];
        setPatients(available);
        const selected = role === "patient"
          ? available.find((item) => item.userId === userId)
          : available.find((item) => item.id === initialPatientId) ?? available[0];
        if (selected) setPatientId(selected.id);
        else setError("No patient records found. Run `npm run db:setup` to initialize the demo database.");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load patients.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialPatientId, role, userId]);

  useEffect(() => {
    if (!patientId) return;
    refreshMeals().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load meal records.");
    });
  }, [patientId, refreshMeals]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        patients={patients}
        patientId={patientId}
        onPatientChange={setPatientId}
        piiMasked={piiMasked}
        onTogglePii={() => setPiiMasked((current) => !current)}
        role={role}
      />
      <WorkflowStepper activeTab={activeTab} onChange={setActiveTab} role={role} />

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading patient records...
          </div>
        ) : error && !patient ? (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            {error}
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}
            {activeTab === "workflow" && (
              <DashboardMetrics
                patient={patient}
                meals={meals}
                totals={totals}
                piiMasked={piiMasked}
                onNavigate={setActiveTab}
                role={role}
              />
            )}
            {activeTab === "meallog" && (
              <div className="space-y-6">
                <MealLogForm patient={patient} meals={meals} alerts={alerts} onMealLogged={refreshMeals} />
                <AdimeChart patient={patient} meals={meals} totals={totals} />
              </div>
            )}
            {role === "provider" && activeTab === "encpt" && <AdimeNotes patient={patient} />}
            {activeTab === "telehealth" && <JitsiTelehealth patient={patient} role={role} />}
            {role === "provider" && activeTab === "fhir" && <FhirExport patient={patient} piiMasked={piiMasked} />}
            {role === "provider" && activeTab === "heuristics" && <Heuristics />}
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 py-4 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 font-mono text-[11px] sm:flex-row">
          <div>
            <span>NutriCare Tele-nutrition Platform © 2026</span>
            <span className="mx-2">|</span>
            <span>HIPAA Safe Harbor Compliant</span>
          </div>
          <div className="flex space-x-4">
            <span>eNCPT v2024 Taxonomy</span>
            <span>HL7 FHIR R4 Ready</span>
            <span>WebRTC Encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AdimeNotes({ patient }: { patient: Patient }) {
  const [problem, setProblem] = useState("NI-5.4");
  const [etiology, setEtiology] = useState(
    "frequent consumption of high-sodium processed foods and restaurant meals",
  );
  const [signs, setSigns] = useState("daily sodium intake above the recommended limit");
  const problemLabel: Record<string, string> = {
    "NI-5.4": "Excessive Sodium Intake (NI-5.4)",
    "NI-2.1": "Inadequate Oral Intake (NI-2.1)",
    "NC-2.2": "Impaired Nutrient Utilization (NC-2.2)",
    "NB-1.1": "Food & Nutrition Knowledge Deficit (NB-1.1)",
    "NI-5.1": "Excessive Fat Intake (NI-5.1)",
    "NC-3.3": "Undesirable Weight Loss (NC-3.3)",
  };
  const diagnosis = `${problemLabel[problem]} related to ${etiology || "..."} as evidenced by ${signs || "..."}.`;
  const [assessment, setAssessment] = useState(
    `${patient.user.name} presents for nutrition assessment. Current weight ${patient.weightKg} kg, height ${patient.heightCm} cm.`,
  );
  const [intervention, setIntervention] = useState(
    `Nutrition prescription: target ${patient.targetCalories} kcal and ${patient.targetProtein} g protein per day. Set patient-centered dietary goals.`,
  );
  const [monitoring, setMonitoring] = useState("Re-evaluate dietary intake and nutrition goals at follow-up.");
  const [notice, setNotice] = useState("");
  const sections: {
    letter: string;
    title: string;
    value: string;
    readOnly: boolean;
    onChange: (value: string) => void;
  }[] = [
    { letter: "A", title: "Assessment (Anthropometric, Biochemical, Dietary)", value: assessment, readOnly: false, onChange: setAssessment },
    { letter: "D", title: "Diagnosis (Standardized eNCPT Domain)", value: diagnosis, readOnly: true, onChange: () => undefined },
    { letter: "I", title: "Intervention (Prescription & Goals)", value: intervention, readOnly: false, onChange: setIntervention },
    { letter: "M", title: "Monitoring & Evaluation (KPIs & Indicators)", value: monitoring, readOnly: false, onChange: setMonitoring },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">eNCPT ADIME Clinical Documentation</h2>
          <p className="mt-1 text-xs text-slate-500">
            Electronic Nutrition Care Process Terminology structured for clinical notes. ADIME notes are not yet saved to the patient record.
          </p>
        </div>
        <button
          onClick={() => setNotice("Marked for this session only. No note was saved to the patient record.")}
          className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
        >
          <i className="fa-solid fa-floppy-disk mr-2" aria-hidden="true" />
          Mark note for this session
        </button>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 text-white shadow-md">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <i className="fa-solid fa-wand-magic-sparkles text-lg text-teal-400" aria-hidden="true" />
          <h3 className="text-sm font-bold">Interactive eNCPT PES Statement Generator</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
          <label className="text-teal-400">
            1. Nutrition Problem Code (P)
            <select value={problem} onChange={(event) => setProblem(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-400 focus:outline-none">
              {Object.entries(problemLabel).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <label className="text-teal-400">
            2. Etiology / Root Cause (E)
            <input value={etiology} onChange={(event) => setEtiology(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-400 focus:outline-none" />
          </label>
          <label className="text-teal-400">
            3. Signs &amp; Symptoms (S)
            <input value={signs} onChange={(event) => setSigns(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-teal-400 focus:outline-none" />
          </label>
        </div>
        <div className="rounded-lg border border-teal-500/30 bg-slate-950 p-4 font-mono text-xs text-teal-200">
          <span className="mb-1 block text-xs font-bold uppercase text-teal-400">Generated Standardized PES Diagnosis:</span>
          {diagnosis}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <label key={section.letter} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm font-bold text-teal-700 shadow-xs">
            <span className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-100 font-mono text-teal-800">{section.letter}</span>
              <span>{section.title}</span>
            </span>
            <textarea
              rows={5}
              readOnly={section.readOnly}
              value={section.value}
              onChange={(event) => section.onChange(event.target.value)}
              className="w-full rounded border border-slate-300 p-3 font-mono text-xs font-normal text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </label>
        ))}
      </section>
      {notice && <p role="status" className="text-xs text-emerald-700">{notice}</p>}
    </div>
  );
}
