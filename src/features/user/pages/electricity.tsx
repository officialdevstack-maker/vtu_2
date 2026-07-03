import { useState } from "react";
import { Plug, CheckCircle, Copy } from "lucide-react";
import { fmt, mockUser } from "../data/mock";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  VerifyField, QuickAmountGrid, ContinueButton, ConfirmSummary, ConfirmActions,
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
      <div className="p-4 lg:p-6 max-w-lg mx-auto pt-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-brand-gradient p-6 text-center relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-white/80 text-xs uppercase tracking-widest mb-1">Token Generated</p>
            <p className="text-white font-bold text-2xl">{fmt(Number(amount))}</p>
            <p className="text-white/70 text-sm mt-1">{selectedDisco.name} {meterType} purchase</p>
          </div>

          <div className="p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Electricity Token</p>
            <div className="bg-gray-50 border-2 border-dashed border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-3 mb-4">
              <span className="font-mono font-bold text-indigo-900 text-xl tracking-widest">{token}</span>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-indigo-500 hover:text-indigo-700 transition">
                {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5 text-center">Enter this token on your electricity meter to load units</p>
            <ConfirmSummary
              title=""
              rows={[
                { label: "Meter Number", value: meterNumber },
                { label: "Customer", value: verifiedName },
                { label: "Units", value: `~${Math.round(Number(amount) * 0.85)} kWh` },
              ]}
            />
            <div className="flex gap-3">
              <button onClick={() => { setStep("form"); setMeterNumber(""); setAmount(""); setVerified(false); setToken(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition">Buy Again</button>
              <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition">Download Receipt</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PurchaseShell>
      <ServiceHeader icon={Plug} iconBg="bg-yellow-50" iconColor="text-yellow-600" title="Electricity" subtitle="Prepaid & postpaid meter recharge" />

      {step === "form" && (
        <div className="p-6 space-y-5">
          <WalletBalanceBanner balance={mockUser.balance} />

          <div>
            <FieldLabel>Distribution Company</FieldLabel>
            <select value={disco} onChange={(e) => setDisco(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition">
              {discos.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.area}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel>Meter Type</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              {(["prepaid", "postpaid"] as const).map((t) => (
                <button key={t} onClick={() => setMeterType(t)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${meterType === t ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <VerifyField
            label="Meter Number"
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
            <FieldLabel>Amount (₦)</FieldLabel>
            <QuickAmountGrid amounts={quickAmounts} value={amount} onChange={setAmount} />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount (min ₦500)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isValid} />
        </div>
      )}

      {step === "confirm" && (
        <div className="p-6">
          <ConfirmSummary
            rows={[
              { label: "DISCO", value: selectedDisco.name },
              { label: "Meter Type", value: meterType.charAt(0).toUpperCase() + meterType.slice(1) },
              { label: "Meter Number", value: meterNumber },
              { label: "Customer", value: verifiedName },
              { label: "Amount", value: fmt(Number(amount)) },
              { label: "Transaction Fee", value: "Free", emphasize: "success" },
            ]}
            totalRow={{ label: "Balance After", value: fmt(mockUser.balance - Number(amount)) }}
          />
          <ConfirmActions onBack={() => setStep("form")} onConfirm={handleConfirm} loading={loading} confirmLabel="Confirm & Buy" />
        </div>
      )}
    </PurchaseShell>
  );
}
