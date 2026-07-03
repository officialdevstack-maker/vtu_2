import { useState } from "react";
import {
  ChevronRight, X, RefreshCw, CheckCircle, Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { services, mockUser, fmt } from "../data/mock";

export default function ServicesPage() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

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
    { label: "Telecom Services", ids: ["airtime", "data"] },
    { label: "Utility Payments", ids: ["cable", "electricity", "education"] },
    { label: "Finance & More", ids: ["giftcard", "transfer", "fund"] },
  ];

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto space-y-5">
      {cats.map((cat) => (
        <div key={cat.label} className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-4">{cat.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services
              .filter((s) => cat.ids.includes(s.id))
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => openService(s.id)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition group text-left"
                >
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-900 text-sm font-medium">{s.label}</p>
                    <p className="text-gray-400 text-xs">{s.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                </button>
              ))}
          </div>
        </div>
      ))}

      {activeService && currentService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${currentService.color} flex items-center justify-center`}>
                  <currentService.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{currentService.label}</h3>
                  <p className="text-gray-400 text-xs">{currentService.description}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === "form" && (
              <div className="p-5 space-y-4">
                {isTelecom && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Select Network</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["MTN", "Airtel", "Glo", "9mobile"].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSelectedNetwork(n)}
                          className={`py-2 text-xs font-medium rounded-lg border transition ${
                            selectedNetwork === n
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
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
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Distribution Company</label>
                    <select className={inputCls}>
                      {["EKEDC \u2014 Eko", "IKEDC \u2014 Ikeja", "AEDC \u2014 Abuja", "PHEDC \u2014 Port Harcourt"].map(
                        (d) => <option key={d}>{d}</option>
                      )}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {isTelecom ? "Phone Number" : activeService === "electricity" ? "Meter Number" : "Account Number"}
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
                    <label className="block text-xs font-medium text-gray-700 mb-2">Amount</label>
                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      {[100, 200, 500, 1000, 2000, 5000].map((a) => (
                        <button
                          key={a}
                          onClick={() => setAmount(String(a))}
                          className={`py-2 text-xs font-medium rounded-lg border transition ${
                            amount === String(a)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
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
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (\u20A6)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className={inputCls} />
                  </div>
                )}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>Wallet balance</span>
                    <span className="font-semibold text-gray-900">{fmt(mockUser.balance)}</span>
                  </div>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={!phone}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="p-5">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5 text-sm">
                  {(
                    [
                      ["Service", currentService.label],
                      ...(isTelecom ? [["Network", selectedNetwork]] : []),
                      ["Recipient", phone || "N/A"],
                      ["Amount", fmt(Number(amount) || 500)],
                      ["Transaction Fee", "Free"],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className={`font-medium ${k === "Transaction Fee" ? "text-emerald-600" : "text-gray-900"}`}>{v}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                    <span className="text-gray-900">Total Debit</span>
                    <span className="text-gray-900">{fmt(Number(amount) || 500)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("form")} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition">Back</button>
                  <button
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        setStep("success");
                      }, 1500);
                    }}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
                  </button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-1">Payment Successful</h3>
                <p className="text-gray-500 text-sm mb-1">
                  {currentService.label} of{" "}
                  <span className="font-medium text-gray-900">{fmt(Number(amount) || 500)}</span>
                </p>
                <p className="text-gray-500 text-sm mb-5">
                  sent to <span className="font-mono font-medium text-gray-900">{phone}</span>
                </p>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 mb-5 font-mono">
                  Ref: VTU{Date.now().toString().slice(-8)}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { closeModal(); navigate("/transactions"); }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Receipt
                  </button>
                  <button onClick={closeModal} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
