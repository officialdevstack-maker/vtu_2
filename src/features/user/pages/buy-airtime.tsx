import { useState } from "react";
import { Phone } from "lucide-react";
import { fmt, mockUser } from "../data/mock";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  NetworkPicker, QuickAmountGrid, ContinueButton, ConfirmSummary,
  ConfirmActions, SuccessScreen, inputCls,
} from "../components/shared-ui";

const networks = [
  { id: "mtn", name: "MTN", bg: "bg-yellow-400", discount: "3% off" },
  { id: "airtel", name: "Airtel", bg: "bg-red-500", discount: "3% off" },
  { id: "glo", name: "Glo", bg: "bg-green-500", discount: "3% off" },
  { id: "9mobile", name: "9mobile", bg: "bg-cyan-500", discount: "3% off" },
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
        title="Airtime sent"
        onReset={() => { setStep("form"); setPhone(""); setAmount(""); }}
        message={
          <>
            <p>{selectedNet.name} airtime of <span className="font-medium text-slate-900">{fmt(Number(amount))}</span></p>
            <p>Delivered to <span className="font-mono font-medium text-slate-900">{phone}</span></p>
          </>
        }
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 font-mono mb-5">
          Ref: VTU{Date.now().toString().slice(-10)}
        </div>
      </SuccessScreen>
    );
  }

  return (
    <PurchaseShell maxWidth="max-w-md">
      <ServiceHeader icon={Phone} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Buy airtime" subtitle="Top up any Nigerian network" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={mockUser.balance} />

          <div>
            <FieldLabel>Select network</FieldLabel>
            <NetworkPicker networks={networks.map((n) => ({ id: n.id, name: n.name, bg: n.bg, extra: n.discount }))} value={network} onChange={setNetwork} />
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
            {phone && phone.length !== 11 && (
              <p className="text-xs text-red-500 mt-1">Enter a valid 11-digit phone number</p>
            )}
          </div>

          <div>
            <FieldLabel>Amount</FieldLabel>
            <QuickAmountGrid amounts={quickAmounts} value={amount} onChange={setAmount} columns={4} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount"
              className={inputCls}
            />
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isValid} />
        </div>
      )}

      {step === "confirm" && (
        <div className="p-5">
          <ConfirmSummary
            rows={[
              { label: "Network", value: selectedNet.name },
              { label: "Phone number", value: phone },
              { label: "Amount", value: fmt(Number(amount)) },
              { label: "Discount", value: selectedNet.discount, emphasize: "success" },
              { label: "Transaction fee", value: "Free", emphasize: "success" },
            ]}
            totalRow={{ label: "Balance after", value: fmt(mockUser.balance - Number(amount)) }}
          />
          <ConfirmActions onBack={() => setStep("form")} onConfirm={handleConfirm} loading={loading} />
        </div>
      )}
    </PurchaseShell>
  );
}
