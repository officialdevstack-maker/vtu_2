import { useState } from "react";
import { HelpCircle, Receipt, Shield, X, ChevronDown } from "lucide-react";

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
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: HelpCircle, label: "Live Chat", desc: "Chat with a support agent now", color: "bg-indigo-50 text-indigo-600", action: () => {} },
          { icon: Receipt, label: "Open Ticket", desc: "Submit a complaint or request", color: "bg-purple-50 text-purple-600", action: () => setTicketOpen(true) },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={opt.action}
            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-200 hover:bg-indigo-50/20 transition text-left"
          >
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

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900 font-semibold text-sm">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
              >
                <span className="text-gray-900 text-sm font-medium pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-indigo-900 text-sm font-medium">Need urgent help?</p>
          <p className="text-indigo-600 text-xs mt-0.5">
            Email <span className="font-medium">support@kora.com</span> or call <span className="font-medium">0800-KORA</span>
          </p>
        </div>
      </div>

      {ticketOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Open Support Ticket</h3>
              <button onClick={() => setTicketOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Issue Category</label>
                <select className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                  {["Transaction Issue", "Wallet Funding", "Account Access", "KYC Verification", "Other"].map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Transaction Reference <span className="text-gray-400">(if applicable)</span>
                </label>
                <input type="text" placeholder="e.g. VTU20240629001" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Describe the issue</label>
                <textarea rows={4} placeholder="Please describe your issue in detail\u2026" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setTicketOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition">Cancel</button>
                <button onClick={() => setTicketOpen(false)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">Submit Ticket</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
