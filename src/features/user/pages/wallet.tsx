import { useState } from "react";
import { Eye, EyeOff, Plus, ArrowUpRight, Building2, CreditCard, Smartphone, Copy, CheckCircle2 } from "lucide-react";
import { mockUser, fmt } from "../data/mock";
import { PageHeader, Card, Button } from "../components/shared-ui";

export default function WalletPage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (_text: string, key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Wallet" description="Fund your wallet and manage your account details" />

      <Card className="p-5 bg-slate-900 border-slate-900">
        <p className="text-slate-400 text-xs mb-1">Available balance</p>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-white text-2xl font-semibold tabular-nums">{balanceVisible ? fmt(mockUser.balance) : "₦ ••••••"}</span>
          <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-slate-400 hover:text-white transition-colors">
            {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-slate-400 text-sm font-mono mb-5">{mockUser.accountNumber}</p>
        <div className="flex gap-2.5">
          <Button fullWidth className="bg-white text-slate-900 hover:bg-gray-100">
            <Plus className="w-4 h-4" /> Fund wallet
          </Button>
          <Button variant="secondary" fullWidth className="bg-white/10 border-white/10 text-white hover:bg-white/15">
            <ArrowUpRight className="w-4 h-4" /> Transfer
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-slate-900 font-semibold text-sm mb-3">Fund your wallet</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Building2, label: "Bank transfer", desc: "Transfer from any bank" },
            { icon: CreditCard, label: "Card payment", desc: "Debit or credit card" },
            { icon: Smartphone, label: "USSD code", desc: "Dial *738# to fund" },
          ].map((opt) => (
            <button key={opt.label} className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <opt.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-slate-900 text-sm font-medium">{opt.label}</p>
                <p className="text-slate-400 text-xs">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-slate-900 font-semibold text-sm mb-3">Virtual account details</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          {[
            ["Bank name", "Providus Bank", "bank"],
            ["Account name", "KORA / Chukwuemeka Obi", "name"],
            ["Account number", "0123456789", "acc"],
          ].map(([label, value, key]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 text-sm font-medium font-mono">{value}</span>
                <button onClick={() => copyText(value, key)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  {copied === key ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-xs mt-3">Transfers to this account are credited instantly, 24/7.</p>
      </Card>
    </div>
  );
}
