const heuristics = [
  [
    "Visibility of System Status",
    "Operational status, patient context, and live CDS warnings keep clinicians informed as meal records are saved.",
  ],
  [
    "Match Between System & Real World",
    "ADIME, PES syntax, eNCPT codes, and nutrition units use familiar clinical language.",
  ],
  [
    "User Control & Freedom",
    "Clinicians can switch patients and move between intake, charting, telehealth, and export workflows.",
  ],
  [
    "Consistency & Standards",
    "The slate-and-teal hierarchy and structured FHIR resources follow recognizable clinical software conventions.",
  ],
  [
    "Error Prevention",
    "Meal entry validates required fields, nutrition values, and patient context before saving.",
  ],
  [
    "Recognition Rather Than Recall",
    "Patient profiles, meal categories, eNCPT codes, and calculated targets are visible in context.",
  ],
  [
    "Flexibility & Efficiency of Use",
    "Quick navigation and reusable patient records keep related nutrition workflows together.",
  ],
  [
    "Aesthetic & Minimalist Design",
    "A restrained slate-and-teal palette emphasizes clinical data and safety alerts.",
  ],
  [
    "Help Users Recognize/Recover from Errors",
    "CDS alerts identify breached thresholds, and forms surface actionable API validation errors.",
  ],
  [
    "Documentation & Compliance",
    "The workspace includes FHIR R4 export and documents its local prototype limitations.",
  ],
];

export function Heuristics() {
  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <div>
        <h2 className="flex items-center space-x-2 text-base font-bold text-slate-900">
          <i className="fa-solid fa-microscope text-teal-600" aria-hidden="true" />
          <span>Human-Centered Heuristic Evaluation Mapping (Nielsen&apos;s 10 Heuristics)</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Evidence of how user experience design principles are fulfilled across this clinical interface.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
        {heuristics.map(([title, detail], index) => (
          <article key={title} className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-mono font-bold text-teal-700">#{index + 1}. {title}</h3>
            <p className="text-slate-600">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
