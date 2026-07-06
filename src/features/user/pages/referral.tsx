import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, CheckCircle2, Gift, Users, DollarSign, Clock } from "lucide-react";
import { fmt } from "../data/mock";
import { PageHeader, Card, Button, SkeletonLine } from "../components/shared-ui";
import { useBranding } from "@/shared/branding";
import { useAuth } from "../../../shared/providers/auth";
import { customerService } from "../services/customerService";

export default function ReferralPage() {
  const { app_name } = useBranding();
  const { user, refreshUser } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [converting, setConverting] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => customerService.getReferralStats(),
  });
  const stats = statsQuery.data;

  const referralLink = useMemo(
    () => (stats?.referral_code ? `${window.location.origin}/register?ref=${stats.referral_code}` : ""),
    [stats?.referral_code],
  );

  const copy = async (value: string, setFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing to fall back to safely.
    }
  };

  const handleConvertReferral = async () => {
    if (!user) return;
    setConverting(true);
    try {
      await customerService.convertReferralToWallet(user.id);
      await Promise.all([refreshUser(), statsQuery.refetch()]);
    } finally {
      setConverting(false);
    }
  };

  const shareText = `Sign up on ${app_name} with my referral code ${stats?.referral_code ?? ""} — ${referralLink}`;

  const shareLinks = stats?.referral_code
    ? [
        { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
        { label: "Copy link", onClick: () => void copy(referralLink, setCopiedLink) },
        { label: "Twitter / X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
        { label: "SMS", href: `sms:?body=${encodeURIComponent(shareText)}` },
      ]
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Referral program" description="Invite friends and earn wallet credit" />

      <Card className="p-5 bg-slate-900 border-slate-900 text-center">
        <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Gift className="w-5 h-5 text-white" />
        </div>
        {statsQuery.isPending ? (
          <SkeletonLine className="h-5 w-48 mx-auto mb-1.5 bg-white/10" />
        ) : (
          <h2 className="text-white text-base font-semibold mb-1.5">
            Earn {stats?.commission_rate ?? 2}% on every referral's purchase
          </h2>
        )}
        <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm mx-auto">
          Share your referral code with friends. You earn a commission every time they make a
          successful purchase — credited to your referral balance, ready to convert to your wallet anytime.
        </p>
        <div className="bg-white/10 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-slate-400 text-xs mb-0.5">Your referral code</p>
            {statsQuery.isPending ? (
              <SkeletonLine className="h-5 w-28 bg-white/10" />
            ) : (
              <p className="text-white font-mono font-semibold tracking-widest">
                {stats?.referral_code ?? "—"}
              </p>
            )}
          </div>
          <Button
            size="sm"
            disabled={!stats?.referral_code}
            onClick={() => void copy(stats?.referral_code ?? "", setCopiedCode)}
            className="bg-white/15 hover:bg-white/25 text-white"
          >
            {copiedCode ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </Button>
        </div>
      </Card>

      {(stats?.referral_balance ?? 0) > 0 && (
        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Referral balance: {fmt(stats?.referral_balance ?? 0)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Convert it to your wallet to spend or withdraw it.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void handleConvertReferral()} loading={converting} disabled={converting}>
            Convert to wallet
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        {statsQuery.isPending
          ? [...Array(3)].map((_, i) => <SkeletonLine key={i} className="h-20 rounded-xl" />)
          : [
              { label: "Total referrals", value: stats?.total_referrals ?? 0, icon: Users },
              { label: "Lifetime earnings", value: fmt(stats?.total_earnings ?? 0), icon: DollarSign },
              { label: "Pending", value: stats?.pending_referrals ?? 0, icon: Clock },
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
            {
              step: "3",
              title: "Earn your reward",
              desc: `Get ${stats?.commission_rate ?? 2}% of every successful purchase they make, credited to your referral balance`,
            },
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
          {shareLinks.map((item) =>
            "href" in item ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors text-center"
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                onClick={item.onClick}
                className="py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors"
              >
                {copiedLink && item.label === "Copy link" ? "Copied!" : item.label}
              </button>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
