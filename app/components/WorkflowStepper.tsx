"use client";

import type { AuthRole, TabId } from "@/app/types";

const steps: { id: TabId; label: string }[] = [
  { id: "workflow", label: "Patient Intake" },
  { id: "meallog", label: "Meal Logging & CDS" },
  { id: "encpt", label: "eNCPT Charting" },
  { id: "telehealth", label: "WebRTC Session" },
];

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "workflow", label: "Workflow Overview", icon: "fa-house-medical" },
  { id: "meallog", label: "Meal Log & CDS Engine", icon: "fa-utensils" },
  { id: "encpt", label: "eNCPT ADIME Charting", icon: "fa-notes-medical" },
  { id: "telehealth", label: "Virtual Session (WebRTC)", icon: "fa-video" },
  { id: "fhir", label: "FHIR R4 EHR Export", icon: "fa-network-wired" },
  { id: "heuristics", label: "Heuristics & Matrix Evaluation", icon: "fa-clipboard-check" },
];

const patientLabels: Partial<Record<TabId, string>> = {
  workflow: "My Overview",
  meallog: "My Meals & Nutrition",
  telehealth: "My Virtual Visit",
};

type WorkflowStepperProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  role: AuthRole;
};

export function WorkflowStepper({ activeTab, onChange, role }: WorkflowStepperProps) {
  const visibleTabs =
    role === "patient"
      ? tabs.filter((tab) => ["workflow", "meallog", "telehealth"].includes(tab.id))
      : tabs;
  const visibleSteps =
    role === "patient" ? steps.filter((step) => step.id !== "encpt") : steps;
  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-2 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto whitespace-nowrap py-1 text-xs">
          <div className="flex items-center space-x-6 text-slate-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              End-to-End Care Flow:
            </span>
            {visibleSteps.map((step, index) => (
              <span key={step.id} className="flex items-center space-x-1.5">
                {index > 0 && (
                  <i className="fa-solid fa-chevron-right mr-4 text-[10px] text-slate-300" aria-hidden="true" />
                )}
                <button
                  type="button"
                  onClick={() => onChange(step.id)}
                  className="flex items-center space-x-1.5 font-medium hover:text-teal-600"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      activeTab === step.id
                        ? "bg-teal-600 text-white"
                        : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              </span>
            ))}
          </div>
          <div className="ml-6 flex items-center space-x-2 whitespace-nowrap font-mono text-[11px] text-slate-500">
            <span className="badge-pulse inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>EHR System Operational</span>
          </div>
        </div>
      </div>
      <nav className="overflow-x-auto bg-slate-800 text-sm text-slate-300">
        <div className="mx-auto flex max-w-7xl whitespace-nowrap px-4 sm:px-6 lg:px-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex items-center space-x-2 border-b-2 px-4 py-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300 sm:text-sm ${
                activeTab === tab.id
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent hover:text-slate-100"
              }`}
            >
              <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
              <span>{role === "patient" ? patientLabels[tab.id] : tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
