import { useState } from "react";
import { ChevronRight, X, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { services, mockUser, fmt } from "../data/mock";
import { PageHeader, Card, Button, ConfirmSummary, inputCls, selectCls } from "../components/shared-ui";

export default function ServicesPage() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openService = (id: string) => {
    setActiveService(id);
    setStep("form");
    setPhone("");
    setAmount("");
  };
  const closeModal = () => {
    setActiveService(null);
    setStep("form");
  };

  const isTelecom = activeService === "airtime" || activeService === "data";
  const currentService = services.find((s) => s.id === activeService);

  const cats = [
    { label: "Telecom services", ids: ["airtime", "data"] },
    { label: "Utility payments", ids: ["cable", "electricity", "education"] },
    { label: "Finance & more", ids: ["giftcard", "transfer", "fund"] },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader title="All services" description="Everything you can pay for on KORA" />

      {cats.map((cat) => (
        <Card key={cat.label} className="p-4">
          <h3 className="text-slate-900 font-semibold text-sm mb-3">{cat.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services
              .filter((s) => cat.ids.includes(s.id))
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => openService(s.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900 text-sm font-medium">{s.label}</p>
                    <p className="text-slate-400 text-xs">{s.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                </button>
              ))}
          </div>
        </Card>
      ))}

      {activeService && currentService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${currentService.color} flex items-center justify-center`}>
                  <currentService.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{currentService.label}</h3>
                  <p className="text-slate-400 text-xs">{currentService.description}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === "form" && (
              <div className="p-4 space-y-4">
                {isTelecom && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Select network</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["MTN", "Airtel", "Glo", "9mobile"].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSelectedNetwork(n)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                            selectedNetwork === n
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 text-slate-600 hover:border-gray-300"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeService === "electricity" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Distribution company</label>
                    <select className={selectCls}>
                      {["EKEDC — Eko", "IKEDC — Ikeja", "AEDC — Abuja", "PHEDC — Port Harcourt"].map(
                        (d) => <option key={d}>{d}</option>
                      )}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    {isTelecom ? "Phone number" : activeService === "electricity" ? "Meter number" : "Account number"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isTelecom ? "08012345678" : "0101234567890"}
                    className={inputCls}
                  />
                </div>
                {activeService === "airtime" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Amount</label>
                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      {[100, 200, 500, 1000, 2000, 5000].map((a) => (
                        <button
                          key={a}
                          onClick={() => setAmount(String(a))}
                          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                            amount === String(a)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 text-slate-600 hover:border-gray-300"
                          }`}
                        >
                          {fmt(a)}
                        </button>
                      ))}
                    </div>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Custom amount" className={inputCls} />
                  </div>
                )}
                {["electricity", "cable", "data"].includes(activeService) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Amount (₦)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className={inputCls} />
                  </div>
                )}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>Wallet balance</span>
                    <span className="font-medium text-slate-900">{fmt(mockUser.balance)}</span>
                  </div>
                  <Button fullWidth disabled={!phone} onClick={() => setStep("confirm")}>Continue</Button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="p-4">
                <ConfirmSummary
                  title=""
                  rows={[
                    { label: "Service", value: currentService.label },
                    ...(isTelecom ? [{ label: "Network", value: selectedNetwork }] : []),
                    { label: "Recipient", value: phone || "N/A" },
                    { label: "Transaction fee", value: "Free", emphasize: "success" as const },
                  ]}
                  totalRow={{ label: "Total debit", value: fmt(Number(amount) || 500) }}
                />
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setStep("form")}>Back</Button>
                  <Button
                    fullWidth
                    loading={loading}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => { setLoading(false); setStep("success"); }, 1500);
                    }}
                  >
                    {loading ? "" : "Confirm payment"}
                  </Button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="p-5 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-slate-900 font-semibold text-sm mb-1">Payment successful</h3>
                <p className="text-slate-500 text-sm mb-1">
                  {currentService.label} of{" "}
                  <span className="font-medium text-slate-900">{fmt(Number(amount) || 500)}</span>
                </p>
                <p className="text-slate-500 text-sm mb-5">
                  Sent to <span className="font-mono font-medium text-slate-900">{phone}</span>
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 mb-5 font-mono">
                  Ref: VTU{Date.now().toString().slice(-8)}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => { closeModal(); navigate("/transactions"); }}
                  >
                    <Download className="w-4 h-4" /> Receipt
                  </Button>
                  <Button fullWidth onClick={closeModal}>Done</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
