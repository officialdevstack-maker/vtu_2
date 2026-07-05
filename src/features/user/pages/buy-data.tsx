import { useState } from "react";
import { Wifi } from "lucide-react";
import { fmt, mockUser } from "../data/mock";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  NetworkPicker, ContinueButton, ConfirmSummary, ConfirmActions, SuccessScreen, inputCls,
} from "../components/shared-ui";

const networks = [
  { id: "mtn", name: "MTN", bg: "bg-yellow-400" },
  { id: "airtel", name: "Airtel", bg: "bg-red-500" },
  { id: "glo", name: "Glo", bg: "bg-green-500" },
  { id: "9mobile", name: "9mobile", bg: "bg-cyan-500" },
];

const dataPlans: Record<string, { id: string; size: string; duration: string; price: number; tag?: string }[]> = {
  mtn: [
    { id: "1", size: "500MB", duration: "1 Day", price: 130 },
    { id: "2", size: "1GB", duration: "1 Day", price: 230 },
    { id: "3", size: "2GB", duration: "30 Days", price: 460, tag: "Popular" },
    { id: "4", size: "3GB", duration: "30 Days", price: 690 },
    { id: "5", size: "5GB", duration: "30 Days", price: 1150 },
    { id: "6", size: "10GB", duration: "30 Days", price: 2200, tag: "Best value" },
    { id: "7", size: "20GB", duration: "30 Days", price: 4200 },
    { id: "8", size: "50GB", duration: "30 Days", price: 9500 },
  ],
  airtel: [
    { id: "1", size: "500MB", duration: "1 Day", price: 140 },
    { id: "2", size: "1GB", duration: "1 Day", price: 250 },
    { id: "3", size: "2GB", duration: "30 Days", price: 490, tag: "Popular" },
    { id: "4", size: "5GB", duration: "30 Days", price: 1200 },
    { id: "5", size: "10GB", duration: "30 Days", price: 2300 },
  ],
  glo: [
    { id: "1", size: "1GB", duration: "1 Day", price: 200 },
    { id: "2", size: "2GB", duration: "30 Days", price: 400, tag: "Popular" },
    { id: "3", size: "5GB", duration: "30 Days", price: 1000 },
    { id: "4", size: "10GB", duration: "30 Days", price: 2000, tag: "Best value" },
  ],
  "9mobile": [
    { id: "1", size: "1GB", duration: "30 Days", price: 300 },
    { id: "2", size: "2.5GB", duration: "30 Days", price: 600, tag: "Popular" },
    { id: "3", size: "5GB", duration: "30 Days", price: 1200 },
    { id: "4", size: "10GB", duration: "30 Days", price: 2000 },
  ],
};

export default function BuyDataPage() {
  const [network, setNetwork] = useState("mtn");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);

  const plans = dataPlans[network];
  const plan = plans.find((p) => p.id === selectedPlan);
  const isValid = phone.length === 11 && selectedPlan !== null;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("success"); }, 1500);
  };

  if (step === "success") {
    return (
      <SuccessScreen
        title="Data activated"
        message={<p>Activated on <span className="font-mono font-medium text-slate-900">{phone}</span></p>}
        onReset={() => { setStep("form"); setPhone(""); setSelectedPlan(null); }}
      />
    );
  }

  return (
    <PurchaseShell>
      <ServiceHeader icon={Wifi} iconBg="bg-[#111827]/10" iconColor="text-[#111827]" title="Buy data" subtitle="Data bundles for every network" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={mockUser.balance} />

          <div>
            <FieldLabel>Select network</FieldLabel>
            <NetworkPicker networks={networks} value={network} onChange={(id) => { setNetwork(id); setSelectedPlan(null); }} />
          </div>

          <div>
            <FieldLabel>Select data plan</FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative p-3 rounded-lg border transition-colors text-left ${selectedPlan === p.id ? "border-[#111827] bg-[#111827]/10" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {p.tag && <span className="absolute -top-2 right-2 bg-[#111827] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">{p.tag}</span>}
                  <p className="font-medium text-slate-900 text-sm">{p.size}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.duration}</p>
                  <p className="text-sm font-medium text-[#111827] mt-1">{fmt(p.price)}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Phone number</FieldLabel>
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="08012345678"
              className={`${inputCls} font-mono`}
            />
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isValid} />
        </div>
      )}

      {step === "confirm" && plan && (
        <div className="p-5">
          <ConfirmSummary
            rows={[
              { label: "Network", value: networks.find((n) => n.id === network)?.name ?? "" },
              { label: "Plan", value: `${plan.size} · ${plan.duration}` },
              { label: "Phone", value: phone },
              { label: "Amount", value: fmt(plan.price) },
              { label: "Fee", value: "Free", emphasize: "success" },
            ]}
          />
          <ConfirmActions onBack={() => setStep("form")} onConfirm={handleConfirm} loading={loading} />
        </div>
      )}
    </PurchaseShell>
  );
}
