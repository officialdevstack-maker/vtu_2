import { useState } from "react";
import { HelpCircle, Receipt, Shield, X, ChevronDown } from "lucide-react";
import { PageHeader, Card, Button, inputCls } from "../components/shared-ui";

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketOpen, setTicketOpen] = useState(false);

  const faqs = [
    { q: "How do I fund my wallet?", a: "Fund via bank transfer, card payment, or USSD. Navigate to Wallet > Fund Wallet and choose your preferred method. Bank transfers reflect instantly." },
    { q: "Why did my transaction fail?", a: "Transactions fail due to insufficient balance, incorrect recipient details, or a temporary service disruption. Check your transaction history for the specific error and contact support if needed." },
    { q: "How long does airtime delivery take?", a: "Airtime is delivered within seconds in most cases. If it has not arrived within 2 minutes, open a support ticket and our team will resolve it promptly." },
    { q: "How do I reset my transaction PIN?", a: 'Go to Settings > Security > Transaction PIN and tap "Update". You will be asked to verify your identity via OTP before setting a new PIN.' },
    { q: "Is my money safe on KORA?", a: "Yes. KORA uses bank-grade 256-bit encryption and is registered with the CBN. Your wallet balance is fully protected." },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Support" description="Get help or browse frequently asked questions" />

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: HelpCircle, label: "Live chat", desc: "Chat with a support agent now", action: () => {} },
          { icon: Receipt, label: "Open ticket", desc: "Submit a complaint or request", action: () => setTicketOpen(true) },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={opt.action}
            className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-left"
          >
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

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-slate-900 font-semibold text-sm">Frequently asked questions</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-slate-900 text-sm font-medium pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3.5">
                  <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-indigo-50 border-indigo-100 flex items-center gap-3.5">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-4.5 h-4.5 text-indigo-600" />
        </div>
        <div>
          <p className="text-indigo-900 text-sm font-medium">Need urgent help?</p>
          <p className="text-indigo-700 text-xs mt-0.5">
            Email <span className="font-medium">support@kora.com</span> or call <span className="font-medium">0800-KORA</span>
          </p>
        </div>
      </Card>

      {ticketOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm">Open support ticket</h3>
              <button onClick={() => setTicketOpen(false)} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Issue category</label>
                <select className={inputCls}>
                  {["Transaction issue", "Wallet funding", "Account access", "KYC verification", "Other"].map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Transaction reference <span className="text-slate-400">(if applicable)</span>
                </label>
                <input type="text" placeholder="e.g. VTU20240629001" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Describe the issue</label>
                <textarea rows={4} placeholder="Please describe your issue in detail…" className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" fullWidth onClick={() => setTicketOpen(false)}>Cancel</Button>
                <Button fullWidth onClick={() => setTicketOpen(false)}>Submit ticket</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
