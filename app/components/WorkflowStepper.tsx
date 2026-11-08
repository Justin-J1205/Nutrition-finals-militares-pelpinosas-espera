"use client";

import type { AuthRole, TabId } from "@/app/types";

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
  return (
    <>
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
