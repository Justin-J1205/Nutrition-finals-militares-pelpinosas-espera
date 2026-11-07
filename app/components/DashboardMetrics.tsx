import type { AuthRole, Meal, NutritionTotals, Patient, TabId } from "@/app/types";

type DashboardMetricsProps = {
  patient: Patient;
  meals: Meal[];
  totals: NutritionTotals;
  piiMasked: boolean;
  onNavigate: (tab: TabId) => void;
  role: AuthRole;
};

export function DashboardMetrics({
  patient,
  meals,
  totals,
  piiMasked,
  onNavigate,
  role,
}: DashboardMetricsProps) {
  const bmi = patient.weightKg / (patient.heightCm / 100) ** 2;
  const flagged = totals.sodium > 2000;
  const patientNumber = patient.mrn.slice(-5);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 text-xl font-bold text-slate-500">
              <i className="fa-solid fa-user-doctor" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {role === "patient"
                    ? `Welcome, ${patient.user.name}`
                    : piiMasked
                      ? `Patient #${patientNumber}`
                      : patient.user.name}
                </h2>
                {flagged && (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Action Required: High Sodium CDS Flag
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-slate-500">
                <span>
                  MRN:{" "}
                  <strong className="text-slate-700">
                    {role === "patient"
                      ? "Your profile"
                      : piiMasked
                        ? `MRN-****-${patientNumber}`
                        : patient.mrn}
                  </strong>
                </span>
                {role === "provider" && (
                  <>
                    <span>
                      DOB:{" "}
                      <strong className="text-slate-700">
                        {piiMasked
                          ? `${patient.dateOfBirth.slice(0, 4)}-**-**`
                          : patient.dateOfBirth.slice(0, 10)}
                      </strong>
                    </span>
                    <span>
                      Sex: <strong className="text-slate-700">{patient.sex}</strong>
                    </span>
                    <span>
                      Primary Dx: <strong className="text-slate-700">{patient.diagnosis || "Not recorded"}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {role === "provider" && (
              <button
                onClick={() => onNavigate("meallog")}
                className="flex items-center space-x-2 rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <i className="fa-solid fa-chart-line text-teal-600" aria-hidden="true" />
                <span>Review Intake</span>
              </button>
            )}
            <button
              onClick={() => onNavigate("telehealth")}
              className="flex items-center space-x-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-700"
            >
              <i className="fa-solid fa-headset" aria-hidden="true" />
              <span>{role === "patient" ? "Join Virtual Session" : "Start Virtual Session"}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          title="Weight & BMI"
          value={`${patient.weightKg.toFixed(1)} kg`}
          detail={`BMI ${bmi.toFixed(1)}`}
          icon="fa-weight-scale"
          iconClass="bg-teal-50 text-teal-600"
        />
        <Metric
          title="Mifflin Target"
          value={`${patient.targetCalories.toLocaleString()} kcal/day`}
          detail={`${patient.targetProtein} g protein target`}
          icon="fa-calculator"
          iconClass="bg-blue-50 text-blue-600"
        />
        <Metric
          title="Today's Sodium"
          value={`${totals.sodium.toLocaleString()} mg`}
          detail={flagged ? "Exceeds 2,000mg Limit" : "Within daily limit"}
          icon="fa-bolt"
          iconClass={flagged ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}
          alert={flagged}
        />
        <Metric
          title="Meals Logged Today"
          value={`${meals.length} meals`}
          detail="Active eNCPT care plan"
          icon="fa-file-medical"
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </section>

      {role === "provider" && <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="mb-2 flex items-center space-x-2 text-base font-bold text-slate-900">
          <i className="fa-solid fa-sitemap text-teal-600" aria-hidden="true" />
          <span>Integrated Tele-nutrition Operational Architecture</span>
        </h3>
        <p className="mb-6 text-xs text-slate-500">
          Patient meal telemetry, clinical decision support, eNCPT ADIME documentation, and virtual care in one continuous clinical workspace.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {([
            ["01", "Patient Intake", "Anthropometrics and calculated nutrition targets", "fa-user-doctor", "workflow"],
            ["02", "Meal Telemetry", "Daily intake tracking and clinical alerts", "fa-utensils", "meallog"],
            ["03", "eNCPT ADIME", "Structured nutrition care documentation", "fa-notes-medical", "encpt"],
            ["04", "Virtual Care", "Schedule and launch secure video visits", "fa-video", "telehealth"],
          ] as const).map(([number, title, detail, icon, tab]) => (
            <button
              key={number}
              onClick={() => onNavigate(tab)}
              className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-500"
            >
              <span className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-600">MODULE {number}</span>
                <i className={`fa-solid ${icon} text-slate-400 group-hover:text-teal-600`} aria-hidden="true" />
              </span>
              <span className="block text-sm font-bold text-slate-800">{title}</span>
              <span className="mt-1 block text-xs text-slate-500">{detail}</span>
            </button>
          ))}
        </div>
      </section>}
    </div>
  );
}

function Metric({
  title,
  value,
  detail,
  icon,
  iconClass,
  alert = false,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
  iconClass: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className={`mt-1 text-xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>{value}</h3>
        <p className={`mt-1 text-[11px] font-medium ${alert ? "text-red-500" : "text-slate-500"}`}>
          {alert && <i className="fa-solid fa-triangle-exclamation mr-1" aria-hidden="true" />}
          {detail}
        </p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${iconClass}`}>
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </div>
    </div>
  );
}
