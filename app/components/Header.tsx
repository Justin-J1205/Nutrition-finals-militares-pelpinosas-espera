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
  userName: string;
};

export function Header({
  patients,
  patientId,
  onPatientChange,
  piiMasked,
  onTogglePii,
  role,
  userName,
}: HeaderProps) {
  const currentPatient = patients.find((patient) => patient.id === patientId);
  const displayName = role === "provider" ? userName : currentPatient?.user.name ?? userName;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-900 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:px-8 lg:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-lg text-white">
            <i className="fa-solid fa-heart-pulse" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-base font-bold tracking-tight">
              NutriCare<span className="font-medium text-teal-300"> EHR</span>
            </p>
            <p className="truncate text-[11px] text-slate-400">Tele-nutrition care platform</p>
          </div>
        </div>

        {role === "provider" && (
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 lg:max-w-sm">
            <i className="fa-solid fa-hospital-user shrink-0 text-sm text-teal-300" aria-hidden="true" />
            <span className="shrink-0 text-xs font-medium text-slate-300">Patient</span>
            <select
              value={patientId}
              onChange={(event) => onPatientChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              aria-label="Active patient"
              disabled={patients.length === 0}
            >
              {patients.length === 0 ? (
                <option value="">No patient records</option>
              ) : (
                patients.map((patient) => (
                  <option key={patient.id} value={patient.id} className="bg-slate-900">
                    {patient.user.name} · {piiMasked ? `MRN-****-${patient.mrn.slice(-5)}` : patient.mrn}
                  </option>
                ))
              )}
            </select>
          </label>
        )}

        <div className="ml-auto flex items-center gap-3">
          {role === "provider" && (
            <button
              type="button"
              onClick={onTogglePii}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 transition hover:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              role="switch"
              aria-checked={piiMasked}
              aria-label={`${piiMasked ? "Disable" : "Enable"} patient identifier masking`}
              title={piiMasked ? "Patient identifiers are masked" : "Patient identifiers are visible"}
            >
              <i className="fa-solid fa-shield-halved text-teal-300" aria-hidden="true" />
              <span className="hidden sm:inline">PII {piiMasked ? "masked" : "visible"}</span>
              <span
                className={`relative h-4 w-7 rounded-full transition-colors ${
                  piiMasked ? "bg-teal-600" : "bg-slate-600"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                    piiMasked ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          )}
          <div className="hidden items-center gap-2 border-l border-slate-700 pl-3 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-teal-200">
              {initials}
            </div>
            <div className="max-w-48">
              <p className="truncate text-xs font-semibold text-slate-100">{displayName}</p>
              <p className="text-[10px] text-slate-400">
                {role === "provider" ? "Clinical provider" : "Patient"}
              </p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-teal-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
