import { useState } from "react";
import { Wifi, Phone, Tv, Plug, Info } from "lucide-react";
import { PageHeader, Card } from "../components/shared-ui";

type NoteTone = "amber" | "blue" | "emerald";

const noteStyles: Record<NoteTone, string> = {
  amber: "bg-amber-50 border-amber-100 text-amber-800",
  blue: "bg-blue-50 border-blue-100 text-blue-800",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
};

/** Consistent inline callout used across the service tabs. */
function Note({
  tone,
  title,
  children,
}: {
  tone: NoteTone;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex gap-2.5 rounded-xl border p-3.5 ${noteStyles[tone]}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
      <div className="min-w-0">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <p className={`text-xs leading-relaxed ${title ? "mt-0.5 opacity-90" : ""}`}>
          {children}
        </p>
      </div>
    </div>
  );
}

type NetworkTab = "mtn" | "airtel" | "glo" | "9mobile";

const networkColors: Record<NetworkTab, { bg: string; text: string }> = {
  mtn: { bg: "bg-yellow-400", text: "text-yellow-900" },
  airtel: { bg: "bg-red-500", text: "text-white" },
  glo: { bg: "bg-green-500", text: "text-white" },
  "9mobile": { bg: "bg-cyan-500", text: "text-white" },
};

const dataPlans: Record<NetworkTab, { size: string; duration: string; price: string; tag?: string }[]> = {
  mtn: [
    { size: "500MB", duration: "1 Day", price: "₦130" },
    { size: "1GB", duration: "1 Day", price: "₦230" },
    { size: "2GB", duration: "30 Days", price: "₦460", tag: "Popular" },
    { size: "3GB", duration: "30 Days", price: "₦690" },
    { size: "5GB", duration: "30 Days", price: "₦1,150" },
    { size: "10GB", duration: "30 Days", price: "₦2,200", tag: "Best value" },
    { size: "20GB", duration: "30 Days", price: "₦4,200" },
    { size: "50GB", duration: "30 Days", price: "₦9,500" },
    { size: "100GB", duration: "30 Days", price: "₦18,000" },
  ],
  airtel: [
    { size: "500MB", duration: "1 Day", price: "₦140" },
    { size: "1GB", duration: "1 Day", price: "₦250" },
    { size: "2GB", duration: "30 Days", price: "₦490", tag: "Popular" },
    { size: "5GB", duration: "30 Days", price: "₦1,200" },
    { size: "10GB", duration: "30 Days", price: "₦2,300", tag: "Best value" },
    { size: "20GB", duration: "30 Days", price: "₦4,400" },
    { size: "50GB", duration: "30 Days", price: "₦9,900" },
  ],
  glo: [
    { size: "1GB", duration: "1 Day", price: "₦200" },
    { size: "2GB", duration: "30 Days", price: "₦400", tag: "Popular" },
    { size: "5GB", duration: "30 Days", price: "₦1,000" },
    { size: "10GB", duration: "30 Days", price: "₦2,000" },
    { size: "15GB", duration: "30 Days", price: "₦3,000", tag: "Best value" },
    { size: "30GB", duration: "30 Days", price: "₦5,500" },
  ],
  "9mobile": [
    { size: "500MB", duration: "30 Days", price: "₦200" },
    { size: "1GB", duration: "30 Days", price: "₦300", tag: "Popular" },
    { size: "2.5GB", duration: "30 Days", price: "₦600" },
    { size: "5GB", duration: "30 Days", price: "₦1,200" },
    { size: "10GB", duration: "30 Days", price: "₦2,000", tag: "Best value" },
    { size: "20GB", duration: "30 Days", price: "₦3,500" },
  ],
};

const airtimeDiscount: Record<NetworkTab, string> = {
  mtn: "3% discount", airtel: "3% discount", glo: "4% discount", "9mobile": "5% discount",
};

const cablePackages = [
  { provider: "DStv", packages: [{ name: "Access", price: "₦2,500" }, { name: "Family", price: "₦5,000" }, { name: "Compact", price: "₦10,500" }, { name: "Premium", price: "₦29,500" }] },
  { provider: "GOtv", packages: [{ name: "Lite", price: "₦800" }, { name: "Value", price: "₦1,500" }, { name: "Jolli", price: "₦3,500" }, { name: "Max", price: "₦4,850" }] },
  { provider: "Startimes", packages: [{ name: "Nova", price: "₦900" }, { name: "Basic", price: "₦1,850" }, { name: "Smart", price: "₦2,600" }, { name: "Super", price: "₦4,900" }] },
];

const electricityDiscos = [
  { name: "EKEDC (Eko)", min: "₦500" },
  { name: "IKEDC (Ikeja)", min: "₦500" },
  { name: "AEDC (Abuja)", min: "₦500" },
  { name: "PHEDC (Port Harcourt)", min: "₦500" },
  { name: "EEDC (Enugu)", min: "₦500" },
  { name: "IBEDC (Ibadan)", min: "₦500" },
];

type ServiceTab = "data" | "airtime" | "cable" | "electricity";

export default function PricingPage() {
  const [serviceTab, setServiceTab] = useState<ServiceTab>("data");
  const [networkTab, setNetworkTab] = useState<NetworkTab>("mtn");

  const serviceTabs: { id: ServiceTab; label: string; icon: React.ElementType }[] = [
    { id: "data", label: "Data plans", icon: Wifi },
    { id: "airtime", label: "Airtime", icon: Phone },
    { id: "cable", label: "Cable TV", icon: Tv },
    { id: "electricity", label: "Electricity", icon: Plug },
  ];

  const networks: NetworkTab[] = ["mtn", "airtel", "glo", "9mobile"];

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4">
      <PageHeader title="Pricing" description="Transparent rates across every service, no hidden fees" />

      <Card className="min-w-0 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {serviceTabs.map((t) => {
            const active = serviceTab === t.id;
            return (
              <button key={t.id} onClick={() => setServiceTab(t.id)}
                className={`relative flex min-w-[7.5rem] flex-none items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap sm:flex-1 ${active ? "text-[#111827]" : "text-slate-400 hover:text-slate-600"}`}>
                <t.icon className="h-4 w-4 shrink-0" />
                {t.label}
                {active && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#111827]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          {serviceTab === "data" && (
            <>
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {networks.map((n) => {
                  const c = networkColors[n];
                  return (
                    <button key={n} onClick={() => setNetworkTab(n)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all shrink-0 ${networkTab === n ? `${c.bg} ${c.text} border-transparent shadow-sm` : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>
                      {n.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dataPlans[networkTab].map((p, i) => {
                  const tagged = Boolean(p.tag);
                  return (
                    <div
                      key={i}
                      className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${
                        tagged
                          ? "border-[#111827]/30 bg-[#111827]/[0.02] ring-1 ring-inset ring-[#111827]/10"
                          : "border-slate-200 hover:border-[#111827]/30"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-semibold text-slate-900">{p.size}</p>
                          {p.tag && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none ${
                                p.tag === "Best value"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-[#111827] text-white"
                              }`}
                            >
                              {p.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{p.duration}</p>
                      </div>
                      <p className="shrink-0 text-lg font-bold text-[#111827]">{p.price}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {serviceTab === "airtime" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">We offer discounted airtime rates for all networks. You get more airtime than you pay for.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {networks.map((n) => {
                  const c = networkColors[n];
                  return (
                    <div key={n} className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 p-3.5 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`w-9 h-9 ${c.bg} rounded-full flex items-center justify-center ${c.text} font-semibold text-sm shrink-0`}>{n[0].toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 uppercase text-sm">{n}</p>
                          <p className="text-xs text-slate-400">All denominations</p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-semibold text-emerald-600 text-sm">{airtimeDiscount[n]}</p>
                        <p className="text-xs text-slate-400">on all purchases</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Note tone="amber" title="How airtime discount works">
                When you purchase ₦1,000 of MTN airtime, you get ₦1,030 actual
                airtime (3% discount). Your wallet is debited ₦1,000.
              </Note>
            </div>
          )}

          {serviceTab === "cable" && (
            <div className="space-y-4">
              {cablePackages.map((provider) => (
                <div key={provider.provider}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{provider.provider}</h3>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {provider.packages.map((pkg) => (
                      <div key={pkg.name} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition-all hover:border-[#111827]/30 hover:shadow-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{pkg.name}</p>
                          <p className="text-xs text-slate-400">Monthly</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-[#111827]">{pkg.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Note tone="blue">
                Prices shown are the official provider rates. No extra charges.
              </Note>
            </div>
          )}

          {serviceTab === "electricity" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">Recharge prepaid and postpaid meters for all discos instantly with zero transaction fees.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {electricityDiscos.map((d) => (
                  <div key={d.name} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition-all hover:shadow-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{d.name}</p>
                      <p className="text-xs text-slate-400">Min: {d.min}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Free</span>
                  </div>
                ))}
              </div>
              <Note tone="emerald">
                Tokens are generated and delivered instantly after payment.
                Minimum purchase is ₦500.
              </Note>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
