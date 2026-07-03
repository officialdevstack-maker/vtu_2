import { useState } from "react";
import { CreditCard, Wifi, Phone, Tv, Plug } from "lucide-react";

type NetworkTab = "mtn" | "airtel" | "glo" | "9mobile";

const networkColors: Record<NetworkTab, { bg: string; text: string; border: string }> = {
  mtn: { bg: "bg-yellow-400", text: "text-yellow-900", border: "border-yellow-400" },
  airtel: { bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  glo: { bg: "bg-green-500", text: "text-white", border: "border-green-500" },
  "9mobile": { bg: "bg-cyan-500", text: "text-white", border: "border-cyan-500" },
};

const dataPlans: Record<NetworkTab, { size: string; duration: string; price: string; tag?: string }[]> = {
  mtn: [
    { size: "500MB", duration: "1 Day", price: "₦130" },
    { size: "1GB", duration: "1 Day", price: "₦230" },
    { size: "2GB", duration: "30 Days", price: "₦460", tag: "Popular" },
    { size: "3GB", duration: "30 Days", price: "₦690" },
    { size: "5GB", duration: "30 Days", price: "₦1,150" },
    { size: "10GB", duration: "30 Days", price: "₦2,200", tag: "Best Value" },
    { size: "20GB", duration: "30 Days", price: "₦4,200" },
    { size: "50GB", duration: "30 Days", price: "₦9,500" },
    { size: "100GB", duration: "30 Days", price: "₦18,000" },
  ],
  airtel: [
    { size: "500MB", duration: "1 Day", price: "₦140" },
    { size: "1GB", duration: "1 Day", price: "₦250" },
    { size: "2GB", duration: "30 Days", price: "₦490", tag: "Popular" },
    { size: "5GB", duration: "30 Days", price: "₦1,200" },
    { size: "10GB", duration: "30 Days", price: "₦2,300", tag: "Best Value" },
    { size: "20GB", duration: "30 Days", price: "₦4,400" },
    { size: "50GB", duration: "30 Days", price: "₦9,900" },
  ],
  glo: [
    { size: "1GB", duration: "1 Day", price: "₦200" },
    { size: "2GB", duration: "30 Days", price: "₦400", tag: "Popular" },
    { size: "5GB", duration: "30 Days", price: "₦1,000" },
    { size: "10GB", duration: "30 Days", price: "₦2,000" },
    { size: "15GB", duration: "30 Days", price: "₦3,000", tag: "Best Value" },
    { size: "30GB", duration: "30 Days", price: "₦5,500" },
  ],
  "9mobile": [
    { size: "500MB", duration: "30 Days", price: "₦200" },
    { size: "1GB", duration: "30 Days", price: "₦300", tag: "Popular" },
    { size: "2.5GB", duration: "30 Days", price: "₦600" },
    { size: "5GB", duration: "30 Days", price: "₦1,200" },
    { size: "10GB", duration: "30 Days", price: "₦2,000", tag: "Best Value" },
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
  { name: "EKEDC (Eko)", min: "₦500", processing: "Free" },
  { name: "IKEDC (Ikeja)", min: "₦500", processing: "Free" },
  { name: "AEDC (Abuja)", min: "₦500", processing: "Free" },
  { name: "PHEDC (Port Harcourt)", min: "₦500", processing: "Free" },
  { name: "EEDC (Enugu)", min: "₦500", processing: "Free" },
  { name: "IBEDC (Ibadan)", min: "₦500", processing: "Free" },
];

type ServiceTab = "data" | "airtime" | "cable" | "electricity";

export default function PricingPage() {
  const [serviceTab, setServiceTab] = useState<ServiceTab>("data");
  const [networkTab, setNetworkTab] = useState<NetworkTab>("mtn");

  const serviceTabs: { id: ServiceTab; label: string; icon: React.ElementType }[] = [
    { id: "data", label: "Data Plans", icon: Wifi },
    { id: "airtime", label: "Airtime", icon: Phone },
    { id: "cable", label: "Cable TV", icon: Tv },
    { id: "electricity", label: "Electricity", icon: Plug },
  ];

  const networks: NetworkTab[] = ["mtn", "airtel", "glo", "9mobile"];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden bg-brand-gradient">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">Our Pricing</h2>
            <p className="text-indigo-200 text-xs">Transparent, fair, and lowest rates guaranteed</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[["Zero", "Transaction Fees"], ["3-5%", "Airtime Discount"], ["Instant", "Delivery Guaranteed"]].map(([v, l]) => (
            <div key={l} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
              <p className="font-bold text-white text-lg">{v}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Service tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {serviceTabs.map((t) => (
            <button key={t.id} onClick={() => setServiceTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${serviceTab === t.id ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Data Plans */}
          {serviceTab === "data" && (
            <>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {networks.map((n) => {
                  const c = networkColors[n];
                  return (
                    <button key={n} onClick={() => setNetworkTab(n)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 border-2 ${networkTab === n ? `${c.bg} ${c.text} ${c.border}` : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {n.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dataPlans[networkTab].map((p, i) => (
                  <div key={i} className="relative flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition group">
                    {p.tag && <span className="absolute -top-2 left-3 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{p.tag}</span>}
                    <div>
                      <p className="font-bold text-gray-900">{p.size}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.duration}</p>
                    </div>
                    <p className="font-bold text-indigo-600 text-lg">{p.price}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Airtime */}
          {serviceTab === "airtime" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">We offer discounted airtime rates for all networks. You get more airtime than you pay for.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {networks.map((n) => {
                  const c = networkColors[n];
                  return (
                    <div key={n} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center ${c.text} font-bold text-sm`}>{n[0].toUpperCase()}</div>
                        <div>
                          <p className="font-bold text-gray-900 uppercase">{n}</p>
                          <p className="text-xs text-gray-400">All denominations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{airtimeDiscount[n]}</p>
                        <p className="text-xs text-gray-400">on all purchases</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-3">
                <p className="text-sm text-amber-800 font-semibold mb-1">How airtime discount works</p>
                <p className="text-xs text-amber-700">When you purchase ₦1,000 of MTN airtime, you get ₦1,030 actual airtime (3% discount). Your wallet is debited ₦1,000.</p>
              </div>
            </div>
          )}

          {/* Cable TV */}
          {serviceTab === "cable" && (
            <div className="space-y-4">
              {cablePackages.map((provider) => (
                <div key={provider.provider}>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{provider.provider}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {provider.packages.map((pkg) => (
                      <div key={pkg.name} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{pkg.name}</p>
                          <p className="text-xs text-gray-400">Monthly</p>
                        </div>
                        <p className="font-bold text-indigo-600">{pkg.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-700 font-medium">Prices shown are the official provider rates. No extra charges.</p>
              </div>
            </div>
          )}

          {/* Electricity */}
          {serviceTab === "electricity" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">Recharge prepaid and postpaid meters for all DISCOs instantly with zero transaction fees.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {electricityDiscos.map((d) => (
                  <div key={d.name} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{d.name}</p>
                      <p className="text-xs text-gray-400">Min: {d.min}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">{d.processing}</span>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs text-emerald-700 font-medium">Tokens are generated and delivered instantly after payment. Minimum purchase is ₦500.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
