import { useState } from "react";
import { Tv } from "lucide-react";
import { fmt, mockUser } from "../data/mock";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  VerifyField, ContinueButton, ConfirmSummary, ConfirmActions, SuccessScreen,
} from "../components/shared-ui";

const providers = [
  { id: "dstv", name: "DStv", logo: "D", bg: "bg-blue-600" },
  { id: "gotv", name: "GOtv", logo: "G", bg: "bg-orange-500" },
  { id: "startimes", name: "Startimes", logo: "S", bg: "bg-red-600" },
];

const packages: Record<string, { id: string; name: string; price: number; channels: string }[]> = {
  dstv: [
    { id: "1", name: "Access", price: 2500, channels: "42 channels" },
    { id: "2", name: "Access Africa", price: 3500, channels: "55 channels" },
    { id: "3", name: "Family", price: 5000, channels: "75 channels" },
    { id: "4", name: "Compact", price: 10500, channels: "130+ channels" },
    { id: "5", name: "Compact Plus", price: 16600, channels: "160+ channels" },
    { id: "6", name: "Premium", price: 29500, channels: "200+ channels" },
  ],
  gotv: [
    { id: "1", name: "Lite", price: 800, channels: "25 channels" },
    { id: "2", name: "Value", price: 1500, channels: "45 channels" },
    { id: "3", name: "Plus", price: 2700, channels: "60 channels" },
    { id: "4", name: "Jolli", price: 3500, channels: "80 channels" },
    { id: "5", name: "Max", price: 4850, channels: "95 channels" },
  ],
  startimes: [
    { id: "1", name: "Nova", price: 900, channels: "30 channels" },
    { id: "2", name: "Basic", price: 1850, channels: "50 channels" },
    { id: "3", name: "Smart", price: 2600, channels: "65 channels" },
    { id: "4", name: "Classic", price: 3100, channels: "80 channels" },
    { id: "5", name: "Super", price: 4900, channels: "100+ channels" },
  ],
};

export default function CableTVPage() {
  const [provider, setProvider] = useState("dstv");
  const [cardNumber, setCardNumber] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);

  const pkg = packages[provider].find((p) => p.id === selectedPkg);
  const isValid = cardNumber.length >= 10 && verified && selectedPkg !== null;

  const handleVerify = () => {
    if (cardNumber.length < 10) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setVerifiedName("Emmanuel Okafor");
    }, 1200);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("success"); }, 1500);
  };

  if (step === "success") {
    return (
      <SuccessScreen
        title="Subscription Successful!"
        onReset={() => { setStep("form"); setCardNumber(""); setSelectedPkg(null); setVerified(false); }}
        message={
          <>
            <p>{providers.find((p) => p.id === provider)?.name} {pkg?.name} Package</p>
            <p>activated for <span className="font-bold text-gray-900">{verifiedName}</span></p>
          </>
        }
        resetLabel="Renew Again"
      />
    );
  }

  return (
    <PurchaseShell>
      <ServiceHeader icon={Tv} iconBg="bg-purple-50" iconColor="text-purple-600" title="Cable TV" subtitle="DSTV, GOtv & Startimes subscriptions" />

      {step === "form" && (
        <div className="p-6 space-y-5">
          <WalletBalanceBanner balance={mockUser.balance} />

          <div>
            <FieldLabel>Select Provider</FieldLabel>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setSelectedPkg(null); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${provider === p.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className={`w-12 h-12 ${p.bg} rounded-2xl flex items-center justify-center text-white font-bold text-lg`}>{p.logo}</div>
                  <span className="text-xs font-bold text-gray-700">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <VerifyField
            label="Smart Card / IUC Number"
            value={cardNumber}
            onChange={(v) => { setCardNumber(v); setVerified(false); setVerifiedName(""); }}
            onVerify={handleVerify}
            verifying={verifying}
            verified={verified}
            verifiedLabel={verifiedName}
            maxLength={12}
            placeholder="e.g. 1234567890"
          />

          <div>
            <FieldLabel>Select Package</FieldLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {packages[provider].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPkg(p.id)}
                  className={`p-3.5 rounded-xl border-2 transition-all text-left ${selectedPkg === p.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.channels}</p>
                  <p className="text-sm font-bold text-indigo-600 mt-1.5">{fmt(p.price)}/mo</p>
                </button>
              ))}
            </div>
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isValid} />
        </div>
      )}

      {step === "confirm" && pkg && (
        <div className="p-6">
          <ConfirmSummary
            title="Confirm Subscription"
            rows={[
              { label: "Provider", value: providers.find((p) => p.id === provider)?.name ?? "" },
              { label: "Package", value: pkg.name },
              { label: "Smart Card", value: cardNumber },
              { label: "Customer", value: verifiedName },
              { label: "Amount", value: fmt(pkg.price) },
              { label: "Transaction Fee", value: "Free", emphasize: "success" },
            ]}
          />
          <ConfirmActions onBack={() => setStep("form")} onConfirm={handleConfirm} loading={loading} />
        </div>
      )}
    </PurchaseShell>
  );
}
