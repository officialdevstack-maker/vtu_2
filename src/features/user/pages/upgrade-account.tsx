import { useState } from "react";
import { ArrowUpCircle, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  ConfirmActions, SuccessScreen, PinField,
} from "../components/shared-ui";
import { customerService } from "../services/customerService";

export default function UpgradeAccountPage() {
  const { user, refreshUser } = useAuth();

  const tiersQuery = useQuery({
    queryKey: ["upgrade-tiers"],
    queryFn: () => customerService.getUpgradeTiers(),
  });

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const currentTierSlug = tiersQuery.data?.current_tier ?? user?.user_type ?? "user";
  const currentTierName = tiersQuery.data?.current_tier_name ?? currentTierSlug;
  const tiers = (tiersQuery.data?.tiers ?? []).filter((t) => t.slug !== currentTierSlug);
  const selected = tiers.find((t) => t.slug === selectedSlug);

  const isConfirmValid = pin.length === 4;

  const handleConfirm = async () => {
    if (!selectedSlug) return;
    if (!isConfirmValid) {
      setError("Enter your 4-digit transaction PIN to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await customerService.upgradeAccount({ upgrade_to: selectedSlug, pin });
      setResultMessage(result.message);
      setStep("success");
      await refreshUser();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not complete this upgrade. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setSelectedSlug(null);
    setPin("");
    setError(null);
    setResultMessage(null);
  };

  if (step === "success") {
    return (
      <PurchaseShell>
        <SuccessScreen
          title="Account upgraded"
          onReset={reset}
          message={<p>{resultMessage ?? `Your account is now on the ${selected?.name ?? ""} tier.`}</p>}
        />
      </PurchaseShell>
    );
  }

  return (
    <PurchaseShell>
      <ServiceHeader
        icon={ArrowUpCircle}
        iconBg="bg-[#111827]/10"
        iconColor="text-[#111827]"
        title="Upgrade account"
        subtitle="Unlock better rates and higher limits"
      />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <div>
            <FieldLabel>Current tier</FieldLabel>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-medium text-slate-900">
              {currentTierName}
            </div>
          </div>

          <div>
            <FieldLabel>Available tiers</FieldLabel>
            {tiersQuery.isPending ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : tiers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No upgrade tiers are available right now.
              </p>
            ) : (
              <div className="space-y-2">
                {tiers.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setSelectedSlug(t.slug)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-colors text-left ${selectedSlug === t.slug ? "border-[#111827] bg-[#111827]/10" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {selectedSlug === t.slug && (
                        <div className="w-4.5 h-4.5 rounded-full bg-[#111827] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="font-medium text-slate-900 text-sm">{t.name}</p>
                    </div>
                    <p className="text-sm font-medium text-[#111827]">{fmt(t.cost)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selected}
            onClick={() => setStep("confirm")}
            className="w-full rounded-lg bg-[#111827] text-white text-sm font-medium py-2.5 transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            Continue
          </button>
        </div>
      )}

      {step === "confirm" && selected && (
        <div className="p-5 space-y-4">
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-sm text-slate-500">Upgrading to</span>
              <span className="text-sm font-medium text-slate-900">{selected.name}</span>
            </div>
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-sm text-slate-500">Cost</span>
              <span className="text-sm font-medium text-slate-900">{fmt(selected.cost)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <PinField value={pin} onChange={setPin} />

          <ConfirmActions
            onBack={() => setStep("form")}
            onConfirm={() => void handleConfirm()}
            loading={loading}
            confirmLabel="Confirm upgrade"
          />
        </div>
      )}
    </PurchaseShell>
  );
}
