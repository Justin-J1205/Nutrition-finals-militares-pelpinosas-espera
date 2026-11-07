"use client";

import { useState } from "react";
import type { Patient } from "@/app/types";

export function FhirExport({
  patient,
  piiMasked,
}: {
  patient: Patient;
  piiMasked: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function downloadBundle() {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({
        patientId: patient.id,
        piiMasked: String(piiMasked),
      });
      const response = await fetch(`/api/fhir?${params}`);
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "Unable to generate FHIR export.");
      }
      const blob = new Blob([await response.text()], { type: "application/fhir+json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `fhir_patient_export_${patient.id}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to generate FHIR export.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <div>
        <h2 className="flex items-center space-x-2 text-base font-bold text-slate-900">
          <i className="fa-solid fa-network-wired text-teal-600" aria-hidden="true" />
          <span>FHIR R4 EHR Export</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Generate a downloadable FHIR Bundle from this patient&apos;s saved profile and meal records.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <p><strong className="text-slate-800">Patient:</strong> {piiMasked ? "Masked for export" : patient.user.name}</p>
        <p className="mt-1"><strong className="text-slate-800">Included resources:</strong> Patient, NutritionOrder, and meal Observation entries.</p>
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <button
        onClick={downloadBundle}
        disabled={busy}
        className="rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        <i className="fa-solid fa-download mr-2" aria-hidden="true" />
        {busy ? "Preparing export..." : "Download FHIR R4 Bundle"}
      </button>
    </section>
  );
}
