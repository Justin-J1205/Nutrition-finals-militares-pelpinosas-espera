"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Appointment, AuthRole, Patient } from "@/app/types";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        width: string;
        height: string;
        parentNode: HTMLElement;
        userInfo: { displayName: string };
        configOverwrite: Record<string, unknown>;
        interfaceConfigOverwrite: Record<string, unknown>;
      },
    ) => { dispose: () => void };
  }
}

type JitsiTelehealthProps = { patient: Patient; role: AuthRole };

export function JitsiTelehealth({ patient, role }: JitsiTelehealthProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [callActive, setCallActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);
  const appointment = appointments.find((item) => item.id === selectedAppointment);

  useEffect(() => {
    let active = true;
    setAppointments([]);
    setSelectedAppointment("");
    setCallActive(false);
    setError("");
    setNotice("");
    setAppointmentsLoading(true);
    fetch(`/api/appointments?patientId=${encodeURIComponent(patient.id)}`)
      .then(async (response) => {
        const result = (await response.json()) as {
          appointments?: Appointment[];
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || "Unable to load appointments.");
        if (active) {
          setAppointments(result.appointments ?? []);
          if (result.appointments?.[0]) setSelectedAppointment(result.appointments[0].id);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load appointments.");
        }
      })
      .finally(() => {
        if (active) setAppointmentsLoading(false);
      });
    return () => {
      active = false;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [patient.id]);

  useEffect(() => {
    if (!callActive || !appointment || !containerRef.current) return;
    const container = containerRef.current;
    container.replaceChildren();
    if (window.JitsiMeetExternalAPI) {
      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: appointment.jitsiRoomId,
        width: "100%",
        height: "100%",
        parentNode: container,
        userInfo: { displayName: "Sarah Jenkins (RD Provider)" },
        configOverwrite: {
          startWithAudioMuted: false,
          disableThirdPartyRequests: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "hangup",
            "chat",
            "raisehand",
            "tileview",
          ],
        },
      });
    } else {
      const frame = document.createElement("iframe");
      frame.src = `https://meet.jit.si/${encodeURIComponent(appointment.jitsiRoomId)}`;
      frame.allow = "camera; microphone; display-capture; autoplay";
      frame.title = "Jitsi telehealth consultation";
      frame.className = "h-full w-full border-0";
      container.append(frame);
    }
    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
      container.replaceChildren();
    };
  }, [appointment, callActive]);

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      const result = (await response.json()) as {
        appointment?: Appointment;
        error?: string;
      };
      if (!response.ok || !result.appointment) {
        throw new Error(result.error || "Unable to schedule appointment.");
      }
      const refreshed = await fetch(
        `/api/appointments?patientId=${encodeURIComponent(patient.id)}`,
      );
      const refreshedResult = (await refreshed.json()) as {
        appointments?: Appointment[];
        error?: string;
      };
      if (!refreshed.ok) throw new Error(refreshedResult.error || "Appointment saved but the schedule could not refresh.");
      setAppointments(refreshedResult.appointments ?? []);
      setSelectedAppointment(result.appointment.id);
      setNotice("Appointment scheduled. Its unique Jitsi room is ready.");
      setScheduledAt("");
    } catch (bookError) {
      setError(bookError instanceof Error ? bookError.message : "Unable to schedule appointment.");
    } finally {
      setBusy(false);
    }
  }

  function endCall() {
    apiRef.current?.dispose();
    apiRef.current = null;
    setCallActive(false);
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="flex items-center space-x-2 text-base font-bold text-slate-900">
          <i className="fa-solid fa-video text-teal-600" aria-hidden="true" />
          <span>WebRTC Tele-nutrition Virtual Consultation</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {role === "provider"
            ? `Schedule a visit for ${patient.user.name}. The appointment will have its own video room.`
            : "Your provider will schedule your visit. When an appointment is available, choose Join Virtual Session."}
        </p>
      </header>

      <div className={`grid grid-cols-1 gap-6 ${role === "provider" ? "lg:grid-cols-3" : ""}`}>
        {role === "provider" && (
          <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Schedule an appointment</h3>
            <p className="mb-3 text-xs leading-relaxed text-slate-600">
              Choose a future date and time in your local time zone.
            </p>
            <form onSubmit={bookAppointment} className="space-y-3">
              <label htmlFor="appointment-time" className="block text-xs font-semibold text-slate-600">
                Appointment date &amp; time
              </label>
              <input
                id="appointment-time"
                type="datetime-local"
                required
                value={scheduledAt}
                min={new Date(
                  Date.now() + 60_000 - new Date().getTimezoneOffset() * 60_000,
                )
                  .toISOString()
                  .slice(0, 16)}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                <i className="fa-solid fa-calendar-plus mr-2" aria-hidden="true" />
                {busy ? "Booking..." : "Book appointment"}
              </button>
            </form>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-900">Patient appointments</h3>
            {appointmentsLoading ? (
              <p role="status" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                Loading appointment schedule...
              </p>
            ) : appointments.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                No appointments scheduled. Choose a future time above to create a Jitsi room.
              </p>
            ) : (
              <div className="space-y-2">
                {appointments.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedAppointment(item.id);
                      setCallActive(false);
                    }}
                    className={`w-full rounded-lg border p-3 text-left ${
                      selectedAppointment === item.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-semibold text-slate-800">
                      {new Date(item.scheduledAt).toLocaleString()}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] text-slate-500">
                      Room: {item.jitsiRoomId}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          </section>
        )}

        <section className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-md ${role === "provider" ? "lg:col-span-2" : ""}`}>
          <div className="flex flex-col justify-between gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Virtual consultation</h3>
              <p className="mt-1 font-mono text-[10px] text-slate-400">
                {appointment ? appointment.jitsiRoomId : "Book or select an appointment to enable video"}
              </p>
            </div>
            {callActive ? (
              <button onClick={endCall} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                End consultation
              </button>
            ) : (
              <button
                onClick={() => setCallActive(true)}
                disabled={!appointment || appointmentsLoading}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="fa-solid fa-video mr-2" aria-hidden="true" />
                {role === "patient" ? "Join Virtual Session" : "Start Virtual Session"}
              </button>
            )}
          </div>
          <div className="h-[420px] bg-slate-950">
            {callActive ? (
              <div ref={containerRef} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-2xl text-teal-400">
                  <i className="fa-solid fa-video" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {appointmentsLoading
                    ? "Loading appointment schedule..."
                    : appointment
                    ? role === "patient"
                      ? "Your virtual session is ready to join"
                      : "Your appointment room is ready"
                    : "No appointment is available"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {appointmentsLoading
                    ? "Please wait while we check for scheduled visits."
                    : appointment
                    ? `Scheduled for ${new Date(appointment.scheduledAt).toLocaleString()}`
                    : role === "provider"
                      ? `Schedule a visit for ${patient.user.name} to create a unique room.`
                      : "Your care provider has not scheduled a virtual session yet."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {notice}
        </p>
      )}
    </div>
  );
}
