import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, RefreshCw } from "lucide-react";
import { getPublicDataPlans, type PublicDataPlan } from "../services/publicCatalog";
import { SectionHeading, GlowOrb, Button } from "./ui";
import { Reveal } from "./motion";

const NETWORKS = [
  { id: "mtn", label: "MTN", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/240px-New-mtn-logo.jpg", selected: "border-yellow-400 bg-yellow-50/70" },
  { id: "airtel", label: "Airtel", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Airtel_logo.svg/240px-Airtel_logo.svg.png", selected: "border-red-400 bg-red-50/70" },
  { id: "glo", label: "Glo", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Glo_logo.svg/240px-Glo_logo.svg.png", selected: "border-emerald-400 bg-emerald-50/70" },
  { id: "9mobile", label: "9mobile", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/9mobile_logo.png/240px-9mobile_logo.png", selected: "border-teal-500 bg-teal-50/70" },
] as const;

const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

const planLabel = (plan: PublicDataPlan) =>
  plan.amount && plan.unit ? `${plan.amount}${plan.unit}` : plan.plan_name;

function PricingSkeleton() {
  return <div className="animate-pulse space-y-3 p-5 sm:p-7" role="status" aria-label="Loading data plan prices">
    {[0, 1, 2, 3].map((row) => <div key={row} className="grid grid-cols-4 gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="h-4 rounded bg-slate-200" /><span className="h-4 rounded bg-slate-200" />
      <span className="h-4 rounded bg-slate-200" /><span className="h-4 rounded bg-slate-200" />
    </div>)}
  </div>;
}

export function Pricing() {
  const [network, setNetwork] = useState<string>(NETWORKS[0].id);
  const pricingQuery = useQuery({
    queryKey: ["public-data-plans"],
    queryFn: getPublicDataPlans,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  const availableNetworks = useMemo(() => new Set((pricingQuery.data ?? []).map((plan) => plan.network)), [pricingQuery.data]);
  const plans = useMemo(() => (pricingQuery.data ?? []).filter((plan) => plan.network === network), [network, pricingQuery.data]);

  useEffect(() => {
    if (!pricingQuery.isSuccess || availableNetworks.has(network)) return;
    const firstAvailable = NETWORKS.find((item) => availableNetworks.has(item.id));
    if (firstAvailable) setNetwork(firstAvailable.id);
  }, [availableNetworks, network, pricingQuery.isSuccess]);

  return (
    <section aria-labelledby="pricing-title" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal><div id="pricing-title"><SectionHeading kicker="Live pricing" title="Affordable data plans" description="Browse transparent, up-to-date prices across Nigeria’s major mobile networks. No account needed to compare." align="center" /></div></Reveal>

        <Reveal delay={0.1} className="relative mt-12 overflow-hidden rounded-[32px]">
          <div className="glass-strong shadow-premium relative overflow-hidden p-4 sm:p-7 lg:p-8">
            <GlowOrb className="landing-brand-glow right-0 top-0 h-72 w-72 opacity-50" />
            <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Choose a mobile network">
              {NETWORKS.map((item) => {
                const selected = network === item.id;
                return <button key={item.id} type="button" role="tab" aria-selected={selected} aria-controls="pricing-plan-list" onClick={() => setNetwork(item.id)} className={`flex min-h-16 items-center justify-center gap-2.5 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${selected ? `${item.selected} text-slate-900 shadow-sm` : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-slate-300 hover:bg-white"}`}>
                  <img src={item.logo} alt={`${item.label} logo`} className="h-8 w-8 rounded-lg bg-white object-contain ring-1 ring-slate-200/70" loading="lazy" />
                  {item.label}
                </button>;
              })}
            </div>

            <div id="pricing-plan-list" role="tabpanel" className="relative mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80">
              {pricingQuery.isPending ? <PricingSkeleton /> : pricingQuery.isError ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                  <p className="font-medium text-slate-800">Prices are temporarily unavailable.</p><p className="mt-1 text-sm text-slate-500">Please try again in a moment.</p>
                  <button type="button" onClick={() => pricingQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Try again</button>
                </div>
              ) : plans.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center px-6 py-10 text-center text-sm text-slate-500">No data plans are currently available for this network.</div>
              ) : <>
                <div className="hidden sm:block">
                  <table className="w-full table-fixed text-left"><thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th scope="col" className="w-[32%] px-5 py-4">Plan</th><th scope="col" className="px-5 py-4">Type</th><th scope="col" className="px-5 py-4">Validity</th><th scope="col" className="px-5 py-4 text-right">Price</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{plans.map((plan, index) => <tr key={`${plan.network}-${plan.plan_name}-${plan.plan_type}-${index}`} className="transition-colors hover:bg-slate-50/70"><td className="px-5 py-4"><span className="font-semibold text-slate-900">{planLabel(plan)}</span>{planLabel(plan) !== plan.plan_name && <span className="ml-2 text-xs text-slate-400">{plan.plan_name}</span>}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{plan.plan_type}</span></td><td className="px-5 py-4 text-sm text-slate-600">{plan.validity}</td><td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">{formatNaira(plan.selling_price)}</td></tr>)}</tbody>
                  </table>
                </div>
                <ul className="divide-y divide-slate-100 sm:hidden">{plans.map((plan, index) => <li key={`${plan.network}-${plan.plan_name}-${index}`} className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{planLabel(plan)}</p><p className="mt-1 text-xs text-slate-500">{plan.plan_name} · {plan.validity}</p></div><p className="shrink-0 font-semibold tabular-nums text-slate-900">{formatNaira(plan.selling_price)}</p></div><span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{plan.plan_type}</span></li>)}</ul>
              </>}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2} className="mt-8 flex flex-col items-center gap-3 text-center"><p className="text-sm text-slate-500">Ready to get connected? Create your free account to purchase securely.</p><Button to="/register" size="lg">Buy data <ArrowRight className="h-4 w-4" /></Button></Reveal>
      </div>
    </section>
  );
}
