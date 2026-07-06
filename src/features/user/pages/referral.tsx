import { useState } from "react";
import { Copy, CheckCircle2, Gift, Users, DollarSign, Clock } from "lucide-react";
import { mockUser, fmt } from "../data/mock";
import { PageHeader, Card, Button } from "../components/shared-ui";
import { useBranding } from "@/shared/branding";

export default function ReferralPage() {
  const { app_name } = useBranding();
  const [copied, setCopied] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Referral program" description="Invite friends and earn wallet credit" />

      <Card className="p-5 bg-slate-900 border-slate-900 text-center">
        <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-white text-base font-semibold mb-1.5">Earn ₦500 per referral</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm mx-auto">
          Share your referral code with friends. You earn ₦500 when they complete their first transaction.
        </p>
        <div className="bg-white/10 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-slate-400 text-xs mb-0.5">Your referral code</p>
            <p className="text-white font-mono font-semibold tracking-widest">{mockUser.referralCode}</p>
          </div>
          <Button
            size="sm"
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="bg-white/15 hover:bg-white/25 text-white"
          >
            {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total referrals", value: mockUser.referralCount, icon: Users },
          { label: "Earnings", value: fmt(mockUser.referralEarnings), icon: DollarSign },
          { label: "Pending", value: 2, icon: Clock },
        ].map((item) => (
          <Card key={item.label} className="p-3.5 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center mx-auto mb-2">
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-slate-900 font-semibold text-base tabular-nums">{item.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-slate-900 font-semibold text-sm mb-3.5">How it works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your code", desc: "Share your unique referral code or link with friends and family" },
            { step: "2", title: "Friend signs up", desc: `Your friend creates a ${app_name} account using your referral code` },
            { step: "3", title: "Earn your reward", desc: "Get ₦500 credited to your wallet once they complete a transaction" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-7 h-7 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-slate-900 text-sm font-medium">{item.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-slate-900 font-semibold text-sm mb-3">Share via</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {["WhatsApp", "Copy link", "Twitter / X", "SMS"].map((label) => (
            <button key={label} className="py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
