import { useState } from "react";
import { Plug, CheckCircle2, Copy } from "lucide-react";
import { fmt, mockUser } from "../data/mock";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  VerifyField, QuickAmountGrid, ContinueButton, ConfirmSummary, ConfirmActions,
  Card, Button, inputCls, selectCls,
} from "../components/shared-ui";

const discos = [
  { id: "ekedc", name: "EKEDC", area: "Eko" },
  { id: "ikedc", name: "IKEDC", area: "Ikeja" },
  { id: "aedc", name: "AEDC", area: "Abuja" },
  { id: "phedc", name: "PHEDC", area: "Port Harcourt" },
  { id: "eedc", name: "EEDC", area: "Enugu" },
  { id: "ibedc", name: "IBEDC", area: "Ibadan" },
  { id: "kedco", name: "KEDCO", area: "Kano" },
  { id: "yedc", name: "YEDC", area: "Yola" },
];

const quickAmounts = [1000, 2000, 3000, 5000, 10000, 20000];

export default function ElectricityPage() {
  const [disco, setDisco] = useState("ekedc");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [verifyAddress, setVerifyAddress] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  const isValid = meterNumber.length >= 11 && verified && Number(amount) >= 500;
  const selectedDisco = discos.find((d) => d.id === disco)!;

  const handleVerify = () => {
    if (meterNumber.length < 11) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setVerifiedName("Chukwuemeka Obi");
      setVerifyAddress("12 Adeola Odeku, Victoria Island, Lagos");
    }, 1200);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToken(`${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.floor(Math.random() * 90000) + 10000}`);
      setStep("success");
    }, 1500);
  };

  if (step === "success") {
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Token generated</h2>
          <p className="text-slate-500 text-sm mb-5">{selectedDisco.name} {meterType} purchase · {fmt(Number(amount))}</p>

          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 mb-2">
            <p className="text-xs text-slate-500 mb-2">Your electricity token</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono font-semibold text-slate-900 text-lg tracking-wide">{token}</span>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                {copied ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> : <Copy className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-5">Enter this token on your electricity meter to load units</p>

          <ConfirmSummary
            title=""
            rows={[
              { label: "Meter number", value: meterNumber },
              { label: "Customer", value: verifiedName },
              { label: "Units", value: `~${Math.round(Number(amount) * 0.85)} kWh` },
            ]}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => { setStep("form"); setMeterNumber(""); setAmount(""); setVerified(false); setToken(""); }}>
              Buy again
            </Button>
            <Button fullWidth>Download receipt</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PurchaseShell>
      <ServiceHeader icon={Plug} iconBg="bg-amber-50" iconColor="text-amber-600" title="Electricity" subtitle="Prepaid & postpaid meter recharge" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={mockUser.balance} />

          <div>
            <FieldLabel>Distribution company</FieldLabel>
            <select value={disco} onChange={(e) => setDisco(e.target.value)} className={selectCls}>
              {discos.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.area}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel>Meter type</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {(["prepaid", "postpaid"] as const).map((t) => (
                <button key={t} onClick={() => setMeterType(t)}
                  className={`py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${meterType === t ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-slate-600 hover:border-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <VerifyField
            label="Meter number"
            value={meterNumber}
            onChange={(v) => { setMeterNumber(v); setVerified(false); setVerifiedName(""); setVerifyAddress(""); }}
            onVerify={handleVerify}
            verifying={verifying}
            verified={verified}
            verifiedLabel={verifiedName}
            verifiedSub={verifyAddress}
            maxLength={13}
            placeholder="e.g. 01234567890"
          />

          <div>
            <FieldLabel>Amount</FieldLabel>
            <QuickAmountGrid amounts={quickAmounts} value={amount} onChange={setAmount} />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount (min ₦500)"
              className={inputCls} />
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isValid} />
        </div>
      )}

      {step === "confirm" && (
        <div className="p-5">
          <ConfirmSummary
            rows={[
              { label: "Disco", value: selectedDisco.name },
              { label: "Meter type", value: meterType.charAt(0).toUpperCase() + meterType.slice(1) },
              { label: "Meter number", value: meterNumber },
              { label: "Customer", value: verifiedName },
              { label: "Amount", value: fmt(Number(amount)) },
              { label: "Transaction fee", value: "Free", emphasize: "success" },
            ]}
            totalRow={{ label: "Balance after", value: fmt(mockUser.balance - Number(amount)) }}
          />
          <ConfirmActions onBack={() => setStep("form")} onConfirm={handleConfirm} loading={loading} confirmLabel="Confirm & buy" />
        </div>
      )}
    </PurchaseShell>
  );
}
