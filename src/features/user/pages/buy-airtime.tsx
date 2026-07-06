import { useEffect, useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  NetworkPicker, QuickAmountGrid, ContinueButton, ConfirmSummary,
  ConfirmActions, SuccessScreen, PinField, inputCls,
} from "../components/shared-ui";
import { customerService, generateTxRef, type AirtimePlan, type PurchaseResult } from "../services/customerService";

const NETWORK_COLORS: Record<string, string> = {
  mtn: "bg-yellow-400",
  airtel: "bg-red-500",
  glo: "bg-green-500",
  "9mobile": "bg-cyan-500",
};

const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

// Mirrors backend ValidPhoneForNetwork's prefix map exactly, so the network
// we auto-select here always matches what the server would accept.
const NETWORK_PREFIXES: Record<string, string[]> = {
  mtn: ["0803", "0806", "0810", "0813", "0814", "0816", "0703", "0706", "0903", "0906", "0913", "0916"],
  airtel: ["0802", "0808", "0812", "0708", "0701", "0902", "0907", "0901", "0912"],
  glo: ["0805", "0807", "0811", "0815", "0705", "0905", "0915"],
  "9mobile": ["0809", "0817", "0818", "0909", "0908"],
};

function detectNetwork(phone: string): string | null {
  const prefix = phone.slice(0, 4);
  for (const [net, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return net;
  }
  return null;
}

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

  const planByNetwork = useMemo(() => {
    const map = new Map<string, AirtimePlan>();
    for (const plan of airtimePlansQuery.data ?? []) {
      map.set(plan.name.toLowerCase(), plan);
    }
    return map;
  }, [airtimePlansQuery.data]);

  // Airtime Plan (Products > Airtime & Data) is the actual source of truth
  // for whether a network is purchasable — it's the only thing
  // ServiceRequest checks server-side. Service Control's network_types
  // pivot is an unrelated toggle and plays no part in this at all.
  const networks = useMemo(
    () => (networksQuery.data ?? []).filter((n) => planByNetwork.get(n.name.toLowerCase())?.active),
    [networksQuery.data, planByNetwork],
  );

  const [network, setNetwork] = useState("");
  const [networkType, setNetworkType] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [ported, setPorted] = useState(false);
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
    queryFn: () => customerService.previewDiscount("airtime", network, amountNumber),
    enabled: step === "confirm" && Boolean(network) && amountNumber > 0,
  });
  const discountAmount = discountQuery.data?.discount_amount ?? 0;
  const payableAmount = discountAmount > 0 ? amountNumber - discountAmount : amountNumber;

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
  const selectedPlan = planByNetwork.get(network);
  const minAmount = Number(selectedPlan?.min ?? 50);
  const maxAmount = Number(selectedPlan?.max ?? 5000);

  // The Airtime Plan's "category" (set by the admin, one per network — see
  // AirtimePlanFormPage) is the actual network_type this purchase submits.
  // It's not a user choice: Service Control's network_types list is a
  // separate, unrelated toggle that doesn't gate or offer plan types here.
  useEffect(() => {
    setNetworkType(selectedPlan?.category?.toLowerCase() || "vtu");
  }, [selectedPlan]);

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
      setError(extractApiErrorMessage(err, "Could not complete this purchase. Please try again."));
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
    const charged = result.discount_applied?.final_amount ?? Number(result.amount);
    return (
      <SuccessScreen
        title="Airtime sent"
        onReset={reset}
        secondaryLabel="View transactions"
        onSecondary={() => navigate("/transactions")}
        message={
          <>
            <p>{selectedNetwork?.name} airtime of <span className="font-medium text-slate-900">{fmt(charged)}</span></p>
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
      <ServiceHeader icon={Phone} iconBg="bg-[#111827]/10" iconColor="text-[#111827]" title="Buy airtime" subtitle="Top up any Nigerian network" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <div>
            <FieldLabel>Select network</FieldLabel>
            {networksQuery.isPending || airtimePlansQuery.isPending ? (
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
                onChange={setNetwork}
              />
            )}
          </div>

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
                  if (detected && networks.some((n) => n.name.toLowerCase() === detected)) {
                    setNetwork(detected);
                  }
                }
              }}
              placeholder="08012345678"
              className={`${inputCls} font-mono`}
            />
            {phone && phone.length !== 11 && (
              <p className="text-xs text-red-500 mt-1">Enter a valid 11-digit phone number</p>
            )}
            <label className="flex items-center gap-2 mt-2 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ported}
                onChange={(e) => setPorted(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 accent-[#111827]"
              />
              This number was ported from another network
            </label>
          </div>

          <div>
            <FieldLabel>Amount</FieldLabel>
            <QuickAmountGrid
              amounts={quickAmounts.filter((a) => a >= minAmount && a <= maxAmount)}
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
            {amount && (amountNumber < minAmount || amountNumber > maxAmount) && (
              <p className="text-xs text-red-500 mt-1">
                Amount must be between {fmt(minAmount)} and {fmt(maxAmount)} for {selectedNetwork?.name.toUpperCase()}
              </p>
            )}
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isFormValid} />
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
