import { useState } from "react";
import { Phone } from "lucide-react";
import { fmt, mockUser } from "../data/mock";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  NetworkPicker, QuickAmountGrid, ContinueButton, ConfirmSummary,
  ConfirmActions, SuccessScreen,
} from "../components/shared-ui";

const networks = [
  { id: "mtn", name: "MTN", bg: "bg-yellow-400", discount: "3% off" },
  { id: "airtel", name: "Airtel", bg: "bg-red-500", discount: "3% off" },
  { id: "glo", name: "Glo", bg: "bg-green-500", discount: "3% off" },
  { id: "9mobile", name: "9mobile", bg: "bg-cyan-400", discount: "3% off" },
];

const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

export default function BuyAirtimePage() {
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const selectedNet = networks.find((n) => n.id === network)!;

  const isValid = phone.length === 11 && Number(amount) >= 50;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("success"); }, 1500);
  };

  if (step === "success") {
    return (
      <SuccessScreen
        title="Airtime Sent!"
        onReset={() => { setStep("form"); setPhone(""); setAmount(""); }}
        message={
          <>
            <p>{selectedNet.name} airtime of <span className="font-bold text-gray-900">{fmt(Number(amount))}</span></p>
            <p>delivered to <span className="font-mono font-bold text-gray-900">{phone}</span></p>
          </>
        }
      >
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 font-mono mb-6">
          Ref: VTU{Date.now().toString().slice(-10)}
        </div>
      </SuccessScreen>
    );
  }

  return (
    <PurchaseShell maxWidth="max-w-lg">
      <ServiceHeader icon={Phone} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Buy Airtime" subtitle="Top up any Nigerian network" />

      {step === "form" && (
        <div className="p-6 space-y-5">
          <WalletBalanceBanner balance={mockUser.balance} />

          <div>
            <FieldLabel>Select Network</FieldLabel>
            <NetworkPicker networks={networks.map((n) => ({ id: n.id, name: n.name, bg: n.bg, extra: n.discount }))} value={network} onChange={setNetwork} />
          </div>

          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="08012345678"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition font-mono"
            />
            {phone && phone.length !== 11 && (
              <p className="text-xs text-red-500 mt-1">Enter a valid 11-digit phone number</p>
            )}
          </div>

          <div>
            <FieldLabel>Amount (₦)</FieldLabel>
            <QuickAmountGrid amounts={quickAmounts} value={amount} onChange={setAmount} columns={4} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isValid} />
        </div>
      )}

      {step === "confirm" && (
        <div className="p-6">
          <ConfirmSummary
            rows={[
              { label: "Network", value: selectedNet.name },
              { label: "Phone Number", value: phone },
              { label: "Amount", value: fmt(Number(amount)) },
              { label: "Discount", value: selectedNet.discount, emphasize: "success" },
              { label: "Transaction Fee", value: "Free", emphasize: "success" },
            ]}
            totalRow={{ label: "Balance After", value: fmt(mockUser.balance - Number(amount)) }}
          />
          <ConfirmActions onBack={() => setStep("form")} onConfirm={handleConfirm} loading={loading} />
        </div>
      )}
    </PurchaseShell>
  );
}
