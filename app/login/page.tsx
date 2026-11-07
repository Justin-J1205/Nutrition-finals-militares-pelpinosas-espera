import { login } from "@/app/actions/auth";
import { prisma } from "@/app/lib/prisma";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, provider, patient] = await Promise.all([
    searchParams,
    prisma.user.findUnique({
      where: { email: "sarah.jenkins@nutricare.local" },
      select: { id: true, name: true, role: true },
    }),
    prisma.user.findUnique({
      where: { email: "jane.doe@nutricare.local" },
      select: { id: true, name: true, role: true, patientProfile: { select: { id: true } } },
    }),
  ]);
  const providerAction = provider
    ? login.bind(null, "provider", provider.id)
    : undefined;
  const patientAction =
    patient?.patientProfile
      ? login.bind(null, "patient", patient.id)
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 font-sans text-slate-800">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="bg-slate-900 px-8 py-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-xl shadow-inner">
            <i className="fa-solid fa-heart-pulse" aria-hidden="true" />
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-teal-300">
            NutriCare EHR
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Welcome to your care workspace
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Choose a demo account to continue.
          </p>
        </div>

        <div className="space-y-4 p-8">
          {error && (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              This demo account is unavailable. Run <code>npm run db:setup</code> and try again.
            </p>
          )}
          {providerAction ? (
            <form action={providerAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-xl bg-teal-600 px-5 py-4 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <span>
                  <span className="block">Login as Clinical Provider (RD)</span>
                  <span className="mt-1 block text-xs font-normal text-teal-100">
                    Full care team workspace
                  </span>
                </span>
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Provider demo account not found. Run <code>npm run db:setup</code>.
            </p>
          )}

          {patientAction ? (
            <form action={patientAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-800 transition hover:border-teal-500 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <span>
                  <span className="block">Login as Patient (Jane Doe)</span>
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Personal nutrition and visit dashboard
                  </span>
                </span>
                <i className="fa-solid fa-arrow-right text-teal-600" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Patient demo account not found. Run <code>npm run db:setup</code>.
            </p>
          )}

          <p className="border-t border-slate-100 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
            Demo access only. Do not enter real patient information.
          </p>
        </div>
      </section>
    </main>
  );
}
