import { useEffect, useMemo, useState } from "react";
import { Info, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage, detectNetwork } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell,
  ServiceHeader,
  WalletBalanceBanner,
  FieldLabel,
  NetworkPicker,
  OptionPicker,
  QuickAmountGrid,
  ContinueButton,
  ConfirmSummary,
  ConfirmActions,
  SuccessScreen,
  PinField,
  inputCls,
} from "../components/shared-ui";
import {
  customerService,
  generateTxRef,
  type AirtimePlan,
  type PurchaseResult,
} from "../services/customerService";
import { ServiceTabs } from "../components/service-tabs";

const NETWORK_COLORS: Record<string, string> = {
  mtn: "bg-yellow-400",
  airtel: "bg-red-500",
  glo: "bg-green-500",
  "9mobile": "bg-cyan-500",
};

const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

// A plan with no category set (nullable in the DB) still needs a valid
// enum value to submit as network_type — normalize it to "vtu", matching
// ServiceRequest's own fallback server-side.
const planCategory = (plan: AirtimePlan): string =>
  (plan.category || "vtu").toLowerCase();

export default function BuyAirtimePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const networksQuery = useQuery({
    queryKey: ["networks"],
    queryFn: () => customerService.getNetworks(),
  });
  const airtimePlansQuery = useQuery({
    queryKey: ["airtime-plans"],
    queryFn: () => customerService.getAirtimePlans(),
  });

  // Airtime Plan (Products > Airtime & Data) is the sole source of truth
  // for both whether a network is purchasable at all AND which plan
  // types/categories it offers — a network can have several active rows
  // (e.g. a VTU row and a separate SNS row), each with its own min/max.
  // Service Control's network_types pivot is an unrelated toggle and plays
  // no part in this at all.
  const plansByNetwork = useMemo(() => {
    const map = new Map<string, AirtimePlan[]>();
    for (const plan of airtimePlansQuery.data ?? []) {
      if (!plan.active) continue;
      const key = plan.name.toLowerCase();
      map.set(key, [...(map.get(key) ?? []), plan]);
    }
    return map;
  }, [airtimePlansQuery.data]);

  const networks = useMemo(
    () =>
      (networksQuery.data ?? []).filter(
        (n) => (plansByNetwork.get(n.name.toLowerCase())?.length ?? 0) > 0,
      ),
    [networksQuery.data, plansByNetwork],
  );

  const [network, setNetwork] = useState("");
  const [networkType, setNetworkType] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [ported, setPorted] = useState(false);
  const [showPortedHelp, setShowPortedHelp] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  const amountNumber = Number(amount);

  const discountQuery = useQuery({
    queryKey: ["discount-preview", "airtime", network, amountNumber],
    queryFn: () =>
      customerService.previewDiscount("airtime", network, amountNumber),
    enabled: step === "confirm" && Boolean(network) && amountNumber > 0,
  });
  const discountAmount = discountQuery.data?.discount_amount ?? 0;
  const payableAmount =
    discountAmount > 0 ? amountNumber - discountAmount : amountNumber;

  // Default to the first available network once networks load, and again
  // whenever the current selection stops being one of them.
  useEffect(() => {
    if (networks.length === 0) return;
    if (!networks.some((n) => n.name.toLowerCase() === network)) {
      setNetwork(networks[0].name.toLowerCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networks]);

  const selectedNetwork = networks.find(
    (n) => n.name.toLowerCase() === network,
  );
  const availablePlans = plansByNetwork.get(network) ?? [];
  const selectedPlan =
    availablePlans.find((p) => planCategory(p) === networkType) ??
    availablePlans[0];
  const minAmount = Number(selectedPlan?.min ?? 50);
  const maxAmount = Number(selectedPlan?.max ?? 5000);

  // Default to the network's only (or first) plan category, and reset
  // whenever the network changes and the old category no longer applies.
  useEffect(() => {
    if (availablePlans.length === 0) return;
    if (!availablePlans.some((p) => planCategory(p) === networkType)) {
      setNetworkType(planCategory(availablePlans[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePlans]);

  const isFormValid =
    Boolean(selectedNetwork) &&
    Boolean(networkType) &&
    phone.length === 11 &&
    amountNumber >= minAmount &&
    amountNumber <= maxAmount;

  const isConfirmValid = pin.length === 4;

  const handleConfirm = async () => {
    if (!selectedNetwork) return;
    if (!isConfirmValid) {
      setError("Enter your 4-digit transaction PIN to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const purchase = await customerService.purchaseAirtime({
        network,
        phone,
        amount: amountNumber,
        network_type: networkType,
        bypass: ported,
        pin,
        code: code.trim() || undefined,
        tx_ref: generateTxRef("AT"),
      });
      setResult(purchase);
      setStep("success");
      await refreshUser();
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Could not complete this purchase. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setPhone("");
    setAmount("");
    setCode("");
    setPin("");
    setResult(null);
    setError(null);
  };

  if (step === "success" && result) {
    const charged =
      result.discount_applied?.final_amount ?? Number(result.amount);
    return (
      <SuccessScreen
        title="Airtime sent"
        onReset={reset}
        secondaryLabel="View transactions"
        onSecondary={() => navigate("/transactions")}
        message={
          <>
            <p>
              {selectedNetwork?.name} airtime of{" "}
              <span className="font-medium text-slate-900">{fmt(charged)}</span>
            </p>
            <p>
              Delivered to{" "}
              <span className="font-mono font-medium text-slate-900">
                {result.account_or_phone ?? phone}
              </span>
            </p>
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
        <ServiceHeader
          icon={Phone}
          iconBg="bg-[#111827]/10"
          iconColor="text-[#111827]"
          title="Buy airtime"
          subtitle="Top up any Nigerian network"
        />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <div>
            <FieldLabel>Select network</FieldLabel>
            {networksQuery.isPending || airtimePlansQuery.isPending ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[74px] rounded-lg bg-gray-100 animate-pulse"
                  />
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
                onChange={setNetwork}
              />
            )}
          </div>

          {availablePlans.length > 1 && (
            <div>
              <FieldLabel>Plan type</FieldLabel>
              <OptionPicker
                options={Array.from(
                  new Map(
                    availablePlans.map((p) => [
                      planCategory(p),
                      {
                        id: planCategory(p),
                        label: planCategory(p).toUpperCase(),
                        description: p.category
                          ? p.category.toUpperCase()
                          : undefined,
                      },
                    ]),
                  ).values(),
                )}
                value={networkType}
                onChange={setNetworkType}
              />
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
                if (!ported && digits.length >= 4) {
                  const detected = detectNetwork(digits);
                  if (
                    detected &&
                    networks.some((n) => n.name.toLowerCase() === detected)
                  ) {
                    setNetwork(detected);
                  }
                }
              }}
              placeholder="08012345678"
              className={`${inputCls} font-mono`}
            />
            {phone && phone.length !== 11 && (
              <p className="text-xs text-red-500 mt-1">
                Enter a valid 11-digit phone number
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <label className="flex min-w-0 items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ported}
                  onChange={(e) => setPorted(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 accent-[#111827]"
                />
                <span>This number was ported from another network</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPortedHelp((v) => !v)}
                aria-expanded={showPortedHelp}
                aria-label="What does ported number mean?"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            {showPortedHelp && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                Select this if your phone number has been moved from its
                original network to another network. It stops automatic network
                detection from changing your selected network.
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Amount</FieldLabel>
            <QuickAmountGrid
              amounts={quickAmounts.filter(
                (a) => a >= minAmount && a <= maxAmount,
              )}
              value={amount}
              onChange={setAmount}
              columns={4}
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter custom amount (${fmt(minAmount)} - ${fmt(maxAmount)})`}
              className={inputCls}
            />
            {amount &&
              (amountNumber < minAmount || amountNumber > maxAmount) && (
                <p className="text-xs text-red-500 mt-1">
                  Amount must be between {fmt(minAmount)} and {fmt(maxAmount)}{" "}
                  for {selectedNetwork?.name.toUpperCase()}
                </p>
              )}
          </div>

          <ContinueButton
            onClick={() => setStep("confirm")}
            disabled={!isFormValid}
          />
        </div>
      )}

      {step === "confirm" && selectedNetwork && (
        <div className="p-5 space-y-4">
          <ConfirmSummary
            rows={[
              { label: "Network", value: selectedNetwork.name.toUpperCase() },
              { label: "Phone number", value: phone },
              { label: "Amount", value: fmt(amountNumber) },
              ...(discountAmount > 0
                ? [
                    {
                      label: "Discount",
                      value: `- ${fmt(discountAmount)}`,
                      emphasize: "success" as const,
                    },
                    {
                      label: "You pay",
                      value: fmt(payableAmount),
                      emphasize: "success" as const,
                    },
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
