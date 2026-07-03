import { useState } from "react";
import { Copy, CheckCircle, Gift, Users, DollarSign, Clock } from "lucide-react";
import { mockUser, fmt } from "../data/mock";

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      {/* Hero */}
      <div className="bg-indigo-700 rounded-2xl p-6 relative overflow-hidden text-center">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Earn \u20A6500 per referral</h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-5">
            Share your referral code with friends. Earn \u20A6500 when they complete their first transaction.
          </p>
          <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-indigo-300 text-xs mb-1">Your referral code</p>
              <p className="text-white font-mono font-bold text-lg tracking-widest">{mockUser.referralCode}</p>
            </div>
            <button
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
            >
              {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Referrals", value: mockUser.referralCount, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Earnings", value: fmt(mockUser.referralEarnings), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { label: "Pending", value: 2, icon: Clock, color: "bg-amber-50 text-amber-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">{item.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your code", desc: "Share your unique referral code or link with friends and family" },
            { step: "2", title: "Friend signs up", desc: "Your friend creates a KORA account using your referral code" },
            { step: "3", title: "Earn your reward", desc: "Get \u20A6500 credited to your wallet once they complete a transaction" },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{item.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-3">Share via</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-100" },
            { label: "Copy Link", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
            { label: "Twitter / X", color: "bg-gray-50 text-gray-700 border-gray-100" },
            { label: "SMS", color: "bg-blue-50 text-blue-700 border-blue-100" },
          ].map((opt) => (
            <button key={opt.label} className={`py-2.5 rounded-lg text-sm font-medium border transition hover:opacity-80 ${opt.color}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
