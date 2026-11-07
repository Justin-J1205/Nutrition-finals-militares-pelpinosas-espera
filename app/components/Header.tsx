"use client";

import type { AuthRole, Patient } from "@/app/types";
import { logout } from "@/app/actions/auth";

type HeaderProps = {
  patients: Patient[];
  patientId: string;
  onPatientChange: (id: string) => void;
  piiMasked: boolean;
  onTogglePii: () => void;
  role: AuthRole;
};

export function Header({
  patients,
  patientId,
  onPatientChange,
  piiMasked,
  onTogglePii,
  role,
}: HeaderProps) {
  const currentPatient = patients.find((patient) => patient.id === patientId);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:py-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-bold text-white shadow-inner">
              <i className="fa-solid fa-heart-pulse" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  NutriCare<span className="font-normal text-teal-400">EHR</span>
                </span>
                <span className="rounded border border-teal-700 bg-teal-900/80 px-2 py-0.5 font-mono text-xs text-teal-300">
                  v4.2-Clinical
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Tele-nutrition &amp; Digital Health Platform
              </p>
            </div>
          </div>

          {role === "provider" && (
            <label className="flex min-w-0 items-center space-x-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5">
              <i className="fa-solid fa-hospital-user text-sm text-teal-400" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-400">Active Patient:</span>
              <select
                value={patientId}
                onChange={(event) => onPatientChange(event.target.value)}
                className="min-w-0 flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs font-semibold text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 md:flex-initial"
                aria-label="Active patient"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.user.name} (
                    {piiMasked
                      ? `MRN-****-${patient.mrn.slice(-5)}`
                      : patient.mrn}
                    )
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-center justify-between gap-3 md:justify-start md:space-x-4">
            {role === "provider" && (
              <div className="flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5">
                <i className="fa-solid fa-user-shield text-xs text-amber-400" aria-hidden="true" />
                <span className="hidden text-xs font-medium text-slate-300 sm:inline">
                  HIPAA PII Mask
                </span>
                <button
                  type="button"
                  onClick={onTogglePii}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    piiMasked ? "bg-teal-600" : "bg-slate-600"
                  }`}
                  role="switch"
                  aria-checked={piiMasked}
                  aria-label="Toggle patient identifier masking"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      piiMasked ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
            <div className="hidden items-center space-x-2 border-l border-slate-700 pl-4 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-teal-500/30 bg-slate-700 text-xs font-bold text-teal-300">
                {role === "provider" ? "RD" : currentPatient?.user.name.split(" ").map((part) => part[0]).join("")}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {role === "provider" ? "Sarah Jenkins, MS, RD, LDN" : currentPatient?.user.name}
                </p>
                <p className="text-[10px] text-teal-400">
                  {role === "provider" ? "Clinical Dietitian Provider" : "Patient"}
                </p>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-teal-500 hover:text-white"
              >
                <i className="fa-solid fa-arrow-right-from-bracket mr-2" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
