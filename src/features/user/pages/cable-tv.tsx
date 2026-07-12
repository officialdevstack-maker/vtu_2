import { useEffect, useMemo, useState } from "react";
import { Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  NetworkPicker, VerifyField, ContinueButton, ConfirmSummary,
  ConfirmActions, SuccessScreen, PinField, inputCls,
} from "../components/shared-ui";
import { customerService, generateTxRef, applyDiscount, type CablePlan, type PurchaseResult } from "../services/customerService";
import { ServiceTabs } from "../components/service-tabs";

const NETWORK_COLORS: Record<string, string> = {
  dstv: "bg-blue-600",
  gotv: "bg-orange-500",
  startime: "bg-red-600",
  startimes: "bg-red-600",
};

export default function CableTVPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const networksQuery = useQuery({
    queryKey: ["cable-networks"],
    queryFn: () => customerService.getCableNetworks(),
  });
  const cablePlansQuery = useQuery({
    queryKey: ["cable-plans"],
    queryFn: () => customerService.getCablePlans(),
  });

  // Cable Plans (Products > Cable > Cable Plans) is the sole source of
  // truth for whether a network is purchasable at all — the same row
  // ServiceRequest cross-checks server-side.
  const plansByNetwork = useMemo(() => {
    const map = new Map<string, CablePlan[]>();
    for (const plan of cablePlansQuery.data ?? []) {
      if (!plan.active) continue;
      const key = plan.cable_network.toLowerCase();
      map.set(key, [...(map.get(key) ?? []), plan]);
    }
    return map;
  }, [cablePlansQuery.data]);

  const networks = useMemo(
    () => (networksQuery.data ?? []).filter((n) => n.active && (plansByNetwork.get(n.name.toLowerCase())?.length ?? 0) > 0),
    [networksQuery.data, plansByNetwork],
  );

  const [network, setNetwork] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [iuc, setIuc] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  // Default to the first available network once networks load, and again
  // whenever the current selection stops being one of them.
  useEffect(() => {
    if (networks.length === 0) return;
    if (!networks.some((n) => n.name.toLowerCase() === network)) {
      setNetwork(networks[0].name.toLowerCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networks]);

  const selectedNetwork = networks.find((n) => n.name.toLowerCase() === network);
  const plansForNetwork = useMemo(
    () =>
      (plansByNetwork.get(network) ?? [])
        .slice()
        .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)),
    [plansByNetwork, network],
  );

  const selectedPlan = plansForNetwork.find((p) => p.id === selectedPlanId) ?? null;
  const planPrice = Number(selectedPlan?.price ?? 0);

  const discountQuery = useQuery({
    queryKey: ["discount-preview", "cable", network, planPrice],
    queryFn: () => customerService.previewDiscount("cable", network, planPrice),
    enabled: step === "confirm" && Boolean(network) && planPrice > 0,
  });
  const discountAmount = discountQuery.data?.discount_amount ?? 0;
  const payableAmount = discountAmount > 0 ? planPrice - discountAmount : planPrice;

  // Live cable discount rule (network-agnostic — the purchase flow resolves
  // cable discounts with no network), used to strike through package prices.
  const cableDiscountQuery = useQuery({
    queryKey: ["active-discount", "cable"],
    queryFn: () => customerService.getActiveDiscount("cable"),
  });
  const cableDiscount = cableDiscountQuery.data ?? null;

  const handleVerify = async () => {
    if (iuc.length < 10 || !selectedNetwork) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await customerService.verifyCableIuc(network, iuc);
      setVerified(true);
      setVerifiedName(result.name);
    } catch (err) {
      setVerified(false);
      setVerifiedName("");
      setVerifyError(extractApiErrorMessage(err, "Could not verify this smart card number."));
    } finally {
      setVerifying(false);
    }
  };

  const isFormValid = Boolean(selectedNetwork) && Boolean(selectedPlan) && verified;
  const isConfirmValid = pin.length === 4;

  const handleConfirm = async () => {
    if (!selectedNetwork || !selectedPlan) return;
    if (!isConfirmValid) {
      setError("Enter your 4-digit transaction PIN to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const purchase = await customerService.purchaseCable({
        cable_network: network,
        iuc,
        amount: planPrice,
        cable_plan: selectedPlan.id,
        bypass: false,
        pin,
        code: code.trim() || undefined,
        tx_ref: generateTxRef("CB"),
      });
      setResult(purchase);
      setStep("success");
      await refreshUser();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not complete this subscription. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setIuc("");
    setSelectedPlanId(null);
    setVerified(false);
    setVerifiedName("");
    setVerifyError(null);
    setCode("");
    setPin("");
    setResult(null);
    setError(null);
  };

  if (step === "success" && result) {
    const charged = result.discount_applied?.final_amount ?? Number(result.amount);
    return (
      <SuccessScreen
        title="Subscription successful"
        onReset={reset}
        secondaryLabel="View transactions"
        onSecondary={() => navigate("/transactions")}
        resetLabel="Renew again"
        message={
          <>
            <p>{selectedNetwork?.name.toUpperCase()} {selectedPlan?.plan_name} of <span className="font-medium text-slate-900">{fmt(charged)}</span></p>
            <p>Activated for <span className="font-medium text-slate-900">{verifiedName}</span></p>
          </>
        }
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 font-mono mb-5">
          Ref: {result.transaction_reference}
        </div>
      </SuccessScreen>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <ServiceTabs />

      <PurchaseShell>
        <ServiceHeader icon={Tv} iconBg="bg-[#111827]/10" iconColor="text-[#111827]" title="Cable TV" subtitle="DStv, GOtv & Startimes subscriptions" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <div>
            <FieldLabel>Select provider</FieldLabel>
            {networksQuery.isPending || cablePlansQuery.isPending ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[74px] rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <NetworkPicker
                networks={networks.map((n) => ({
                  id: n.name.toLowerCase(),
                  name: n.name.toUpperCase(),
                  bg: NETWORK_COLORS[n.name.toLowerCase()] ?? "bg-slate-400",
                }))}
                value={network}
                onChange={(id) => {
                  setNetwork(id);
                  setSelectedPlanId(null);
                  setVerified(false);
                  setVerifiedName("");
                  setVerifyError(null);
                }}
              />
            )}
          </div>

          <VerifyField
            label="Smart card / IUC number"
            value={iuc}
            onChange={(v) => {
              setIuc(v);
              setVerified(false);
              setVerifiedName("");
              setVerifyError(null);
            }}
            onVerify={() => void handleVerify()}
            verifying={verifying}
            verified={verified}
            verifiedLabel={verifiedName}
            maxLength={12}
            placeholder="e.g. 1234567890"
          />
          {verifyError && (
            <p className="text-xs text-red-500 -mt-2">{verifyError}</p>
          )}

          <div>
            <FieldLabel>Select package</FieldLabel>
            {plansForNetwork.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No packages available for this provider.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {plansForNetwork.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3 rounded-lg border transition-colors text-left ${selectedPlanId === p.id ? "border-[#111827] bg-[#111827]/10" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <p className="font-medium text-slate-900 text-sm">{p.plan_name}</p>
                    {(() => {
                      const original = Number(p.price ?? 0);
                      const discounted = applyDiscount(original, cableDiscount);
                      return discounted < original ? (
                        <p className="text-sm font-medium text-[#111827] mt-1">
                          <span className="text-slate-400 line-through mr-1.5">{fmt(original)}</span>
                          {fmt(discounted)}/mo
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-[#111827] mt-1">{fmt(original)}/mo</p>
                      );
                    })()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isFormValid} />
        </div>
      )}

      {step === "confirm" && selectedNetwork && selectedPlan && (
        <div className="p-5 space-y-4">
          <ConfirmSummary
            title="Confirm subscription"
            rows={[
              { label: "Provider", value: selectedNetwork.name.toUpperCase() },
              { label: "Package", value: selectedPlan.plan_name },
              { label: "Smart card", value: iuc },
              { label: "Customer", value: verifiedName },
              { label: "Amount", value: fmt(planPrice) },
              ...(discountAmount > 0
                ? [
                    { label: "Discount", value: `- ${fmt(discountAmount)}`, emphasize: "success" as const },
                    { label: "You pay", value: fmt(payableAmount), emphasize: "success" as const },
                  ]
                : []),
            ]}
          />

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPromo((v) => !v)}
            className="text-xs font-medium text-[#111827] hover:opacity-80 transition-opacity"
          >
            {showPromo ? "Remove promo code" : "Have a promo code?"}
          </button>
          {showPromo && (
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className={`${inputCls} font-mono uppercase`}
            />
          )}

          <PinField value={pin} onChange={setPin} />

          <ConfirmActions
            onBack={() => setStep("form")}
            onConfirm={() => void handleConfirm()}
            loading={loading}
          />
        </div>
      )}
      </PurchaseShell>
    </div>
  );
}
