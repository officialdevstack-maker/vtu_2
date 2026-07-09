import { useEffect, useMemo, useState } from "react";
import { Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage, detectNetwork } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  NetworkPicker, ContinueButton, ConfirmSummary,
  ConfirmActions, SuccessScreen, PinField, inputCls, selectCls,
} from "../components/shared-ui";
import { customerService, generateTxRef, type DataPlan, type PurchaseResult } from "../services/customerService";

const NETWORK_COLORS: Record<string, string> = {
  mtn: "bg-yellow-400",
  airtel: "bg-red-500",
  glo: "bg-green-500",
  "9mobile": "bg-cyan-500",
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  sme: "SME",
  gifting: "Gifting",
  cooperate_gifting: "Cooperate Gifting",
};

export default function BuyDataPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const networksQuery = useQuery({
    queryKey: ["networks"],
    queryFn: () => customerService.getNetworks(),
  });
  const dataPlansQuery = useQuery({
    queryKey: ["data-plans"],
    queryFn: () => customerService.getDataPlans(),
  });

  // Data Plans (Products > Airtime & Data) is the sole source of truth for
  // both whether a network is purchasable at all AND which plan types
  // (sme/gifting/cooperate_gifting) and bundles it offers.
  const plansByNetwork = useMemo(() => {
    const map = new Map<string, DataPlan[]>();
    for (const plan of dataPlansQuery.data ?? []) {
      if (!plan.active) continue;
      const key = plan.network.toLowerCase();
      map.set(key, [...(map.get(key) ?? []), plan]);
    }
    return map;
  }, [dataPlansQuery.data]);

  const networks = useMemo(
    () => (networksQuery.data ?? []).filter((n) => (plansByNetwork.get(n.name.toLowerCase())?.length ?? 0) > 0),
    [networksQuery.data, plansByNetwork],
  );

  const [network, setNetwork] = useState("");
  const [planType, setPlanType] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
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
  const availablePlans = plansByNetwork.get(network) ?? [];

  const planTypes = useMemo(
    () => Array.from(new Set(availablePlans.map((p) => p.plan_type))),
    [availablePlans],
  );

  // Default to the network's only (or first) plan type, and reset whenever
  // the network changes and the old type no longer applies.
  useEffect(() => {
    if (planTypes.length === 0) return;
    if (!planTypes.includes(planType)) {
      setPlanType(planTypes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planTypes]);

  const plansForType = useMemo(
    () =>
      availablePlans
        .filter((p) => p.plan_type === planType)
        .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)),
    [availablePlans, planType],
  );

  const selectedPlan = plansForType.find((p) => p.id === selectedPlanId) ?? null;
  const planPrice = Number(selectedPlan?.price ?? 0);

  const discountQuery = useQuery({
    queryKey: ["discount-preview", "data", network, planPrice],
    queryFn: () => customerService.previewDiscount("data", network, planPrice),
    enabled: step === "confirm" && Boolean(network) && planPrice > 0,
  });
  const discountAmount = discountQuery.data?.discount_amount ?? 0;
  const payableAmount = discountAmount > 0 ? planPrice - discountAmount : planPrice;

  const isFormValid = Boolean(selectedNetwork) && Boolean(selectedPlan) && phone.length === 11;
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
        const params = {
        network,
        phone,
        amount: planPrice,
        plan_type: planType,
        data_plan: selectedPlan.id,
        bypass: false,
        pin,
        code: code.trim() || undefined,
        tx_ref: generateTxRef("DT"),
      }
      const purchase = await customerService.purchaseData(params);
      setResult(purchase);
      setStep("success");
      await refreshUser();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not complete this purchase. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setPhone("");
    setSelectedPlanId(null);
    setCode("");
    setPin("");
    setResult(null);
    setError(null);
  };

  if (step === "success" && result) {
    const charged = result.discount_applied?.final_amount ?? Number(result.amount);
    return (
      <SuccessScreen
        title="Data activated"
        onReset={reset}
        secondaryLabel="View transactions"
        onSecondary={() => navigate("/transactions")}
        message={
          <>
            <p>{selectedNetwork?.name} {selectedPlan?.plan} of <span className="font-medium text-slate-900">{fmt(charged)}</span></p>
            <p>Delivered to <span className="font-mono font-medium text-slate-900">{result.account_or_phone ?? phone}</span></p>
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
    <PurchaseShell>
      <ServiceHeader icon={Wifi} iconBg="bg-[#111827]/10" iconColor="text-[#111827]" title="Buy data" subtitle="Data bundles for every network" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <div>
            <FieldLabel>Select network</FieldLabel>
            {networksQuery.isPending || dataPlansQuery.isPending ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
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
                }}
              />
            )}
          </div>

          {planTypes.length > 1 && (
            <div>
              <FieldLabel>Plan type</FieldLabel>
              <select
                value={planType}
                onChange={(e) => {
                  setPlanType(e.target.value);
                  setSelectedPlanId(null);
                }}
                className={selectCls}
              >
                {planTypes.map((t) => (
                  <option key={t} value={t}>
                    {PLAN_TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <FieldLabel>Phone number</FieldLabel>
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setPhone(digits);
                if (digits.length >= 4) {
                  const detected = detectNetwork(digits);
                  if (detected && networks.some((n) => n.name.toLowerCase() === detected)) {
                    setNetwork(detected);
                    setSelectedPlanId(null);
                  }
                }
              }}
              placeholder="08012345678"
              className={`${inputCls} font-mono`}
            />
            {phone && phone.length !== 11 && (
              <p className="text-xs text-red-500 mt-1">Enter a valid 11-digit phone number</p>
            )}
          </div>

          <div>
            <FieldLabel>Select data plan</FieldLabel>
            {plansForType.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No plans available for this network.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {plansForType.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`relative p-3 rounded-lg border transition-colors text-left ${selectedPlanId === p.id ? "border-[#111827] bg-[#111827]/10" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <p className="font-medium text-slate-900 text-sm">{p.plan}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.validity}</p>
                    <p className="text-sm font-medium text-[#111827] mt-1">{fmt(Number(p.price ?? 0))}</p>
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
            rows={[
              { label: "Network", value: selectedNetwork.name.toUpperCase() },
              { label: "Plan", value: `${selectedPlan.plan} · ${selectedPlan.validity}` },
              { label: "Phone number", value: phone },
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
  );
}
