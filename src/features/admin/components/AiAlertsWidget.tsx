import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Sparkles, X } from "lucide-react";
import {
  aiManagerService,
  type AiAlert,
} from "../pages/ai-manager/aiManagerService";

/**
 * Floating AI monitor button. The backend's AiMonitor middleware sweeps
 * platform health in the background and records problems as alerts; this
 * widget polls them and floats a pulsing button whenever the AI has
 * something to tell the admin. Renders nothing while all is well.
 */

export const useAiAlerts = (enabled: boolean) =>
  useQuery({
    queryKey: ["ai", "alerts"],
    queryFn: () => aiManagerService.listAlerts(),
    enabled,
    refetchInterval: 60000,
    // Permission-gated endpoint: admins without ai_manager get a 403 — stay
    // quiet instead of retry-looping.
    retry: false,
  });

const SEVERITY_DOT: Record<AiAlert["severity"], string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
};

const AiAlertsWidget = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const alertsQuery = useAiAlerts(true);
  const alerts = alertsQuery.data ?? [];

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["ai", "alerts"] });

  const ackMutation = useMutation({
    mutationFn: (id: number) => aiManagerService.acknowledgeAlert(id),
    onSuccess: refresh,
  });
  const ackAllMutation = useMutation({
    mutationFn: () => aiManagerService.acknowledgeAllAlerts(),
    onSuccess: () => {
      setOpen(false);
      refresh();
    },
  });

  if (alerts.length === 0) return null;

  const hasCritical = alerts.some((a) => a.severity === "critical");

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:right-6">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Sparkles className="h-4 w-4 text-[#111827]" />
            <p className="flex-1 text-sm font-semibold text-slate-900">
              AI monitor
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {alerts.length} open
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-2.5 border-b border-slate-50 px-4 py-3"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`}
                />
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-700">
                  {alert.title}
                </p>
                <button
                  type="button"
                  onClick={() => ackMutation.mutate(alert.id)}
                  disabled={ackMutation.isPending}
                  className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
                  aria-label="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <button
              type="button"
              onClick={() => ackAllMutation.mutate()}
              disabled={ackAllMutation.isPending}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              Dismiss all
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/admin/ai-manager");
              }}
              className="rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#111827]/90"
            >
              Ask AI Manager
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#111827] text-white shadow-lg shadow-[#111827]/30 transition-transform hover:scale-105 sm:right-6"
        aria-label={`AI monitor: ${alerts.length} alert${alerts.length === 1 ? "" : "s"}`}
      >
        <span
          className={`absolute inset-0 animate-ping rounded-full opacity-20 ${
            hasCritical ? "bg-red-500" : "bg-amber-400"
          }`}
        />
        {hasCritical ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white ${
            hasCritical ? "bg-red-500" : "bg-amber-500"
          }`}
        >
          {alerts.length}
        </span>
      </button>
    </>
  );
};

export default AiAlertsWidget;
