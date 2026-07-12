import { useEffect, useMemo, useState } from "react";
import { Plug, CheckCircle2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  VerifyField, QuickAmountGrid, ContinueButton, ConfirmSummary,
  ConfirmActions, PinField, Card, Button, inputCls, selectCls,
} from "../components/shared-ui";
import { customerService, generateTxRef, type PurchaseResult } from "../services/customerService";
import { ServiceTabs } from "../components/service-tabs";

const quickAmounts = [1000, 2000, 3000, 5000, 10000, 20000];

export default function ElectricityPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const billPlansQuery = useQuery({
    queryKey: ["bill-plans"],
    queryFn: () => customerService.getBillPlans(),
  });

  const discos = useMemo(
    () => (billPlansQuery.data ?? []).filter((p) => p.active),
    [billPlansQuery.data],
  );

  const [disco, setDisco] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
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
  const [copied, setCopied] = useState(false);

  // Default to the first available disco once loaded, and again whenever
  // the current selection stops being one of them.
  useEffect(() => {
    if (discos.length === 0) return;
    if (!discos.some((d) => d.disco === disco)) {
      setDisco(discos[0].disco);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discos]);

  const selectedDisco = discos.find((d) => d.disco === disco);
  const minAmount = Number(selectedDisco?.min ?? 500);
  const maxAmount = Number(selectedDisco?.max ?? 100000);
  const amountNumber = Number(amount);

  const discountQuery = useQuery({
    queryKey: ["discount-preview", "electricity", disco, amountNumber],
    queryFn: () => customerService.previewDiscount("electricity", "", amountNumber, { disco }),
    enabled: step === "confirm" && Boolean(disco) && amountNumber > 0,
  });
  const discountAmount = discountQuery.data?.discount_amount ?? 0;
  const serviceFee = discountQuery.data?.service_fee ?? 0;
  const payableAmount = discountQuery.data?.final_amount ?? amountNumber;

  const handleVerify = async () => {
    if (meterNumber.length < 10 || !selectedDisco) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await customerService.verifyMeter(disco, meterNumber, meterType);
      setVerified(true);
      setVerifiedName(res.name);
    } catch (err) {
      setVerified(false);
      setVerifiedName("");
      setVerifyError(extractApiErrorMessage(err, "Could not verify this meter number."));
    } finally {
      setVerifying(false);
    }
  };

  const isFormValid =
    Boolean(selectedDisco) && verified && amountNumber >= minAmount && amountNumber <= maxAmount;
  const isConfirmValid = pin.length === 4;

  const handleConfirm = async () => {
    if (!selectedDisco) return;
    if (!isConfirmValid) {
      setError("Enter your 4-digit transaction PIN to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const purchase = await customerService.purchaseElectricity({
        disco,
        meter_number: meterNumber,
        meter_type: meterType,
        amount: amountNumber,
        bypass: false,
        pin,
        code: code.trim() || undefined,
        tx_ref: generateTxRef("EL"),
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
    setMeterNumber("");
    setAmount("");
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
      <div className="max-w-md mx-auto">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Token generated</h2>
          <p className="text-slate-500 text-sm mb-5">
            {selectedDisco?.disco} {meterType} purchase · {fmt(charged)}
          </p>

          {result.token && (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 mb-2">
              <p className="text-xs text-slate-500 mb-2">Your electricity token</p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono font-semibold text-slate-900 text-lg tracking-wide">{result.token}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.token ?? "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> : <Copy className="w-4.5 h-4.5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Enter this token on your meter to load units</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 font-mono mb-5">
            Ref: {result.transaction_reference}
          </div>

          <ConfirmSummary
            title=""
            rows={[
              { label: "Meter number", value: meterNumber },
              { label: "Customer", value: verifiedName },
            ]}
          />
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" fullWidth onClick={reset}>
              Buy again
            </Button>
            <Button fullWidth onClick={() => navigate("/transactions")}>
              View transactions
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <ServiceTabs />

      <PurchaseShell>
        <ServiceHeader icon={Plug} iconBg="bg-amber-50" iconColor="text-amber-600" title="Electricity" subtitle="Prepaid & postpaid meter recharge" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <div>
            <FieldLabel>Distribution company</FieldLabel>
            {billPlansQuery.isPending ? (
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ) : discos.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No discos are available right now.</p>
            ) : (
              <select
                value={disco}
                onChange={(e) => {
                  setDisco(e.target.value);
                  setVerified(false);
                  setVerifiedName("");
                  setVerifyError(null);
                }}
                className={selectCls}
              >
                {discos.map((d) => (
                  <option key={d.id} value={d.disco}>
                    {d.disco}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <FieldLabel>Meter type</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {(["prepaid", "postpaid"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setMeterType(t);
                    setVerified(false);
                    setVerifiedName("");
                    setVerifyError(null);
                  }}
                  className={`py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${meterType === t ? "border-[#111827] bg-[#111827]/10 text-[#111827]" : "border-gray-200 text-slate-600 hover:border-gray-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <VerifyField
            label="Meter number"
            value={meterNumber}
            onChange={(v) => {
              setMeterNumber(v);
              setVerified(false);
              setVerifiedName("");
              setVerifyError(null);
            }}
            onVerify={() => void handleVerify()}
            verifying={verifying}
            verified={verified}
            verifiedLabel={verifiedName}
            maxLength={13}
            placeholder="e.g. 01234567890"
          />
          {verifyError && <p className="text-xs text-red-500 -mt-2">{verifyError}</p>}

          <div>
            <FieldLabel>Amount</FieldLabel>
            <QuickAmountGrid
              amounts={quickAmounts.filter((a) => a >= minAmount && a <= maxAmount)}
              value={amount}
              onChange={setAmount}
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
                Amount must be between {fmt(minAmount)} and {fmt(maxAmount)}
              </p>
            )}
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isFormValid} />
        </div>
      )}

      {step === "confirm" && selectedDisco && (
        <div className="p-5 space-y-4">
          <ConfirmSummary
            rows={[
              { label: "Disco", value: selectedDisco.disco },
              { label: "Meter type", value: meterType.charAt(0).toUpperCase() + meterType.slice(1) },
              { label: "Meter number", value: meterNumber },
              { label: "Customer", value: verifiedName },
              { label: "Amount", value: fmt(amountNumber) },
              ...(discountAmount > 0
                ? [{ label: "Discount", value: `- ${fmt(discountAmount)}`, emphasize: "success" as const }]
                : []),
              ...(serviceFee > 0
                ? [{ label: "Service fee", value: `+ ${fmt(serviceFee)}` }]
                : []),
              ...(discountAmount > 0 || serviceFee > 0
                ? [{ label: "You pay", value: fmt(payableAmount), emphasize: "success" as const }]
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
            confirmLabel="Confirm & buy"
          />
        </div>
      )}
      </PurchaseShell>
    </div>
  );
}
