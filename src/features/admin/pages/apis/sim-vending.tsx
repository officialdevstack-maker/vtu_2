import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  ListChecks,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  SkeletonRows,
  StatCard,
  StatusBadge,
  Toggle,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  simVendingService,
  type SimDevice,
  type SimRegistrationCode,
  type SimRow,
} from "./simVendingService";

const QUERY_KEY = ["admin", "sim-vending", "overview"];

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}

// ─── Add device modal ────────────────────────────────────────────────────────
// No manual create form — an admin only names the phone and gets a one-time
// code back; the agent app exchanges it for its real slug/secret via
// POST /api/sim/register the first time it connects.

function GenerateCodeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimRegistrationCode | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useMutation({
    mutationFn: () => simVendingService.generateCode(name.trim()),
    onSuccess: (code) => {
      setResult(code);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) =>
      setError(extractErrorMessage(err, "Could not generate a code. Please try again.")),
  });

  const copyCode = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.registration_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {result ? "Registration code generated" : "Add SIM device"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              Enter this one-time code in the agent app on <strong>{result.name}</strong>. The
              device registers itself and reports its SIMs.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <span className="text-sm font-mono text-slate-700 flex-1 break-all select-all">
                {result.registration_code}
              </span>
              <button
                onClick={copyCode}
                className="shrink-0 text-slate-400 hover:text-[#111827] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-600">
              Expires {new Date(result.expires_at).toLocaleString()} — the device shows as
              "awaiting registration" until it connects.
            </p>
            <Button variant="secondary" fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-3.5">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Device name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Office phone 1"
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                fullWidth
                disabled={!name.trim() || generate.isPending}
                loading={generate.isPending}
                onClick={() => generate.mutate()}
              >
                Generate code
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteConfirm({
  name,
  onConfirm,
  onClose,
  deleting,
}: {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            This removes <strong>{name}</strong> and its SIMs. Any in-flight vend jobs are
            refunded by the expiry sweeper. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth disabled={deleting} loading={deleting} onClick={onConfirm}>
            Delete device
          </Button>
        </div>
      </div>
    </div>
  );
}

// One-time display of a rotated secret — it is never retrievable again.
function SecretModal({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">New device secret</h3>
        <p className="text-xs text-slate-500">
          Paste this into the agent app now — the old secret already stopped working and this one
          is not shown again.
        </p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
          <span className="text-xs font-mono text-slate-700 flex-1 break-all select-all">{secret}</span>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(secret);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="shrink-0 text-slate-400 hover:text-[#111827] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <Button variant="secondary" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

function SimTable({ device }: { device: SimDevice }) {
  const queryClient = useQueryClient();

  const updateSim = useMutation({
    mutationFn: ({ sim, field }: { sim: SimRow; field: "enabled" | "supports_airtime" | "supports_data" }) =>
      simVendingService.updateSim(device.id, sim.id, { [field]: !sim[field] }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  if (!device.sims.length) {
    return (
      <p className="px-4 pb-4 text-xs text-slate-400">
        No SIMs reported yet — they appear after the device's first heartbeat.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto px-4 pb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wider">
            <th className="py-1.5 pr-3 font-medium">Slot</th>
            <th className="py-1.5 pr-3 font-medium">Network</th>
            <th className="py-1.5 pr-3 font-medium">Phone</th>
            <th className="py-1.5 pr-3 font-medium">Airtime ₦</th>
            <th className="py-1.5 pr-3 font-medium">Data MB</th>
            <th className="py-1.5 pr-3 font-medium">Airtime</th>
            <th className="py-1.5 pr-3 font-medium">Data</th>
            <th className="py-1.5 pr-3 font-medium">Enabled</th>
          </tr>
        </thead>
        <tbody>
          {device.sims.map((sim) => (
            <tr key={sim.id} className="border-t border-slate-100">
              <td className="py-2 pr-3 text-slate-500">{sim.slot_index}</td>
              <td className="py-2 pr-3">
                <span className="uppercase font-medium text-slate-700">{sim.network}</span>
                {sim.low && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" /> low
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 text-slate-500">{sim.phone_number ?? "—"}</td>
              <td className="py-2 pr-3 text-slate-700">
                {Number(sim.airtime_balance).toLocaleString()}
              </td>
              <td className="py-2 pr-3 text-slate-700">
                {Number(sim.data_balance_mb).toLocaleString()}
              </td>
              <td className="py-2 pr-3">
                <Toggle
                  value={sim.supports_airtime}
                  onChange={() => updateSim.mutate({ sim, field: "supports_airtime" })}
                />
              </td>
              <td className="py-2 pr-3">
                <Toggle
                  value={sim.supports_data}
                  onChange={() => updateSim.mutate({ sim, field: "supports_data" })}
                />
              </td>
              <td className="py-2 pr-3">
                <Toggle
                  value={sim.enabled}
                  onChange={() => updateSim.mutate({ sim, field: "enabled" })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceCard({
  device,
  onShowSecret,
}: {
  device: SimDevice;
  onShowSecret: (secret: string) => void;
}) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const toggleStatus = useMutation({
    mutationFn: () =>
      simVendingService.updateDevice(device.id, {
        status: device.status === "active" ? "paused" : "active",
      }),
    onSettled: invalidate,
  });

  const regenerate = useMutation({
    mutationFn: () => simVendingService.regenerateSecret(device.id),
    onSuccess: (secret) => onShowSecret(secret),
  });

  const remove = useMutation({
    mutationFn: () => simVendingService.removeDevice(device.id),
    onSettled: () => {
      setConfirmDelete(false);
      invalidate();
    },
  });

  return (
    <Card>
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${device.online ? "bg-emerald-500" : "bg-slate-300"}`}
            title={device.online ? "Online" : "Offline"}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{device.name}</p>
              <StatusBadge status={device.registered_at ? device.status : "pending"} />
              {!device.registered_at && device.registration_code && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-mono text-blue-700">
                  code: {device.registration_code}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-400">
              {device.slug} · last seen {timeAgo(device.last_seen_at)}
              {device.app_version ? ` · v${device.app_version}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus.mutate()}
            disabled={toggleStatus.isPending}
            title={device.status === "active" ? "Pause device" : "Resume device"}
          >
            {device.status === "active" ? (
              <PauseCircle className="h-4 w-4" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            title="Regenerate secret"
          >
            {regenerate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            title="Delete device"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <SimTable device={device} />

      {confirmDelete && (
        <DeleteConfirm
          name={device.name}
          deleting={remove.isPending}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutate()}
        />
      )}
    </Card>
  );
}

const SimVendingPage = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => simVendingService.getOverview(),
    refetchInterval: 30000,
  });

  const overview = overviewQuery.data;
  const counts = overview?.job_counts;

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            SIM Vending
            {overview && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  overview.enabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {overview.enabled ? "Enabled" : "Disabled"}
              </span>
            )}
          </span>
        }
        description="Sell airtime and data directly off your own physical SIMs. Purchases route here by default and fall back to API providers when no SIM can serve."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => void queryClient.invalidateQueries({ queryKey: QUERY_KEY })}
            >
              <RefreshCw
                className={`h-4 w-4 ${overviewQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Add device
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending jobs" value={String(counts?.pending ?? 0)} icon={ListChecks} tone="warning" />
        <StatCard label="Claimed jobs" value={String(counts?.claimed ?? 0)} icon={Wifi} tone="neutral" />
        <StatCard label="Successful" value={String(counts?.success ?? 0)} icon={Check} tone="success" />
        <StatCard label="Failed" value={String(counts?.failed ?? 0)} icon={AlertTriangle} tone="danger" />
      </div>

      {overviewQuery.isLoading ? (
        <Card>
          <SkeletonRows count={4} />
        </Card>
      ) : !overview?.devices.length ? (
        <Card>
          <EmptyState
            icon={Smartphone}
            title="No SIM devices yet"
            description="Add a device to get a one-time registration code for the agent app. Once it connects, its SIMs and balances show up here."
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add device
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {overview.devices.map((device) => (
            <DeviceCard key={device.id} device={device} onShowSecret={setSecret} />
          ))}
        </div>
      )}

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Recent vend jobs</p>
        </div>
        {overviewQuery.isLoading ? (
          <SkeletonRows count={4} withAvatar={false} />
        ) : !overview?.recent_jobs.length ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No SIM vend jobs yet — they appear here once purchases route to the fleet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-2 font-medium">Reference</th>
                  <th className="px-4 py-2 font-medium">Service</th>
                  <th className="px-4 py-2 font-medium">Network</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Device</th>
                  <th className="px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent_jobs.map((job) => (
                  <tr key={job.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{job.reference}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-700">{job.service}</td>
                    <td className="px-4 py-2.5 uppercase text-slate-700">{job.network}</td>
                    <td className="px-4 py-2.5 text-slate-500">{job.phone}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      ₦{Number(job.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{job.device ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{job.failure_reason ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && <GenerateCodeModal onClose={() => setShowAdd(false)} />}
      {secret && <SecretModal secret={secret} onClose={() => setSecret(null)} />}
    </div>
  );
};

export default SimVendingPage;
