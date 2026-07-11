import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import {
  Button,
  Card,
  PageHeader,
  SkeletonLine,
  Toggle,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import { ErrorBanner, Field, extractErrorMessage } from "../settings/shared";
import {
  simVendingService,
  type SimRow,
  type SimVendingOverview,
} from "./simVendingService";

const BACK = "/admin/apis/sim-vending";
const QUERY_KEY = ["admin", "sim-vending", "overview"];
const NETWORKS = ["mtn", "airtel", "glo", "9mobile"] as const;

type FormState = {
  slot_index: string;
  network: string;
  phone_number: string;
  transfer_pin: string;
  balance_ussd: string;
  supports_airtime: boolean;
  supports_data: boolean;
  airtime_low_threshold: string;
  data_low_threshold_mb: string;
};

const blankForm = (): FormState => ({
  slot_index: "0",
  network: "mtn",
  phone_number: "",
  transfer_pin: "",
  balance_ussd: "*310#",
  supports_airtime: true,
  supports_data: false,
  airtime_low_threshold: "1000",
  data_low_threshold_mb: "1024",
});

const toForm = (sim: SimRow): FormState => ({
  slot_index: String(sim.slot_index),
  network: sim.network,
  phone_number: sim.phone_number ?? "",
  transfer_pin: "", // never echoed back — blank means "keep the current PIN"
  balance_ussd: sim.balance_ussd ?? "",
  supports_airtime: sim.supports_airtime,
  supports_data: sim.supports_data,
  airtime_low_threshold: String(sim.airtime_low_threshold),
  data_low_threshold_mb: String(sim.data_low_threshold_mb),
});

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputCls} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * Add/edit a SIM on a vending device. The vend config entered here —
 * network, carrier transfer PIN, balance USSD — is stored in the database
 * and pulled by the hub over its signed config endpoint, so nothing is
 * ever hand-edited on the hub machine. The PIN is write-only: encrypted at
 * rest, never sent back to this UI.
 */
const SimFormPage = () => {
  const { deviceId, simId } = useParams<{ deviceId: string; simId?: string }>();
  const isEdit = Boolean(simId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => simVendingService.getOverview(),
  });

  const { device, sim } = useMemo(() => {
    const overview: SimVendingOverview | undefined = overviewQuery.data;
    const foundDevice = overview?.devices.find((d) => String(d.id) === deviceId);
    return {
      device: foundDevice,
      sim: foundDevice?.sims.find((s) => String(s.id) === simId),
    };
  }, [overviewQuery.data, deviceId, simId]);

  const [form, setForm] = useState<FormState>(blankForm());
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (isEdit && sim) setForm(toForm(sim));
  }, [isEdit, sim]);

  const save = useMutation({
    mutationFn: () => {
      const shared = {
        network: form.network,
        phone_number: form.phone_number.trim() || null,
        balance_ussd: form.balance_ussd.trim() || null,
        supports_airtime: form.supports_airtime,
        supports_data: form.supports_data,
      };
      if (isEdit) {
        return simVendingService.updateSim(Number(deviceId), Number(simId), {
          ...shared,
          airtime_low_threshold: Number(form.airtime_low_threshold) || 0,
          data_low_threshold_mb: Number(form.data_low_threshold_mb) || 0,
          // Blank keeps the stored PIN; anything typed replaces it.
          ...(form.transfer_pin.trim() ? { transfer_pin: form.transfer_pin.trim() } : {}),
        });
      }
      return simVendingService.createSim(Number(deviceId), {
        ...shared,
        slot_index: Number(form.slot_index) || 0,
        transfer_pin: form.transfer_pin.trim() || null,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      navigate(BACK);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  if (overviewQuery.isLoading) {
    return (
      <Card className="p-5 space-y-3">
        <SkeletonLine className="h-4 w-40" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-10 w-full" />
      </Card>
    );
  }

  if (!device || (isEdit && !sim)) {
    return (
      <Card className="p-6 text-center text-sm text-slate-500">
        {device ? "SIM not found on this device." : "Device not found."}{" "}
        <button className="underline" onClick={() => navigate(BACK)}>
          Back to SIM Vending
        </button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader
        title={isEdit ? `Edit SIM — slot ${sim?.slot_index}` : "Add SIM"}
        description={`Device: ${device.name}. The hub pulls this configuration automatically — no file edits needed.`}
        actions={
          <Button variant="secondary" onClick={() => navigate(BACK)}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <Card className="p-5 space-y-4">
        {error && <ErrorBanner message={error} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Slot number"
            hint={isEdit ? "Fixed after creation" : "Phone: 0 = SIM 1, 1 = SIM 2"}
          >
            <input
              type="number"
              min={0}
              max={255}
              value={form.slot_index}
              onChange={(e) => set("slot_index", e.target.value)}
              disabled={isEdit}
              className={inputCls}
            />
          </Field>

          <Field label="Network">
            <select
              value={form.network}
              onChange={(e) => set("network", e.target.value)}
              className={selectCls}
            >
              {NETWORKS.map((n) => (
                <option key={n} value={n}>
                  {n.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="SIM phone number" hint="Optional">
          <input
            value={form.phone_number}
            onChange={(e) => set("phone_number", e.target.value)}
            placeholder="08030000000"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Transfer PIN"
            hint={isEdit ? "Blank = keep current" : "Share'N'Sell / Me2U / EasyShare PIN"}
          >
            <SecretInput
              value={form.transfer_pin}
              onChange={(v) => set("transfer_pin", v)}
              placeholder={isEdit && sim?.has_pin ? "••••" : "e.g. 0000"}
            />
          </Field>

          <Field label="Balance check USSD" hint="e.g. *310#">
            <input
              value={form.balance_ussd}
              onChange={(e) => set("balance_ussd", e.target.value)}
              placeholder="*310#"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3">
            <span className="text-xs font-medium text-slate-600">Sells airtime</span>
            <Toggle
              value={form.supports_airtime}
              onChange={(v) => set("supports_airtime", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3">
            <span className="text-xs font-medium text-slate-600">Sells data</span>
            <Toggle
              value={form.supports_data}
              onChange={(v) => set("supports_data", v)}
            />
          </div>
        </div>

        {isEdit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Airtime low alert (₦)">
              <input
                type="number"
                min={0}
                value={form.airtime_low_threshold}
                onChange={(e) => set("airtime_low_threshold", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Data low alert (MB)">
              <input
                type="number"
                min={0}
                value={form.data_low_threshold_mb}
                onChange={(e) => set("data_low_threshold_mb", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => navigate(BACK)}>
            Cancel
          </Button>
          <Button
            disabled={save.isPending}
            loading={save.isPending}
            onClick={() => {
              setError(null);
              save.mutate();
            }}
          >
            {isEdit ? "Save changes" : "Add SIM"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SimFormPage;
