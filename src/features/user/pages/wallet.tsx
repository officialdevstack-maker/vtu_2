import { useState } from "react";
import { Eye, EyeOff, Plus, ArrowUpRight, QrCode, Building2, CreditCard, Smartphone, Copy, CheckCircle } from "lucide-react";
import { mockUser, fmt } from "../data/mock";

export default function WalletPage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (_text: string, key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-3xl mx-auto space-y-4">
      <div className="bg-indigo-700 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide mb-1">KORA Wallet</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-white text-3xl font-semibold">{balanceVisible ? fmt(mockUser.balance) : "\u20A6 \u2022\u2022\u2022\u2022\u2022\u2022"}</span>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-indigo-300 hover:text-white transition">
              {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-indigo-300 text-sm font-mono mb-6">{mockUser.accountNumber}</p>
          <div className="flex gap-3">
            <button className="flex-1 bg-white text-indigo-700 font-medium text-sm py-2.5 rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Fund Wallet
            </button>
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Transfer
            </button>
            <button className="w-12 bg-white/10 hover:bg-white/20 text-white font-medium text-sm py-2.5 rounded-xl transition flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">Fund Your Wallet</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Building2, label: "Bank Transfer", desc: "Transfer from any bank", color: "bg-blue-50 text-blue-600" },
            { icon: CreditCard, label: "Card Payment", desc: "Debit or credit card", color: "bg-indigo-50 text-indigo-600" },
            { icon: Smartphone, label: "USSD Code", desc: "Dial *738# to fund", color: "bg-purple-50 text-purple-600" },
          ].map((opt) => (
            <button key={opt.label} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition text-left">
              <div className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center shrink-0`}>
                <opt.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{opt.label}</p>
                <p className="text-gray-400 text-xs">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">Virtual Account Details</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {[
            ["Bank Name", "Providus Bank", "bank"],
            ["Account Name", "KORA / Chukwuemeka Obi", "name"],
            ["Account Number", "0123456789", "acc"],
          ].map(([label, value, key]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 text-sm font-medium font-mono">{value}</span>
                <button onClick={() => copyText(value, key)} className="text-gray-400 hover:text-gray-600 transition">
                  {copied === key ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">Transfers to this account are credited instantly, 24/7.</p>
      </div>
    </div>
  );
}
