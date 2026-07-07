import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  UserPlus,
  Wallet,
  ShoppingCart,
  Truck,
  CheckCircle2,
  PlugZap,
  SlidersHorizontal,
  Wifi,
  Users,
  Receipt,
  Megaphone,
  Gift,
  Landmark,
  Banknote,
  BellRing,
  Network,
  ToggleLeft,
  HelpCircle,
} from "lucide-react";
import { PageHeader, Card, Button } from "../../../user/components/shared-ui";

// ─── Flow diagram ─────────────────────────────────────────────────────────────

const FLOW_STEPS: { icon: typeof UserPlus; label: string; detail: string }[] = [
  { icon: UserPlus, label: "Customer signs up", detail: "Creates an account, gets a role (e.g. \"user\")" },
  { icon: Wallet, label: "Funds their wallet", detail: "Via a payment gateway, or an admin credits them manually" },
  { icon: ShoppingCart, label: "Buys a service", detail: "Airtime, data, cable, electricity, exam pin…" },
  { icon: Truck, label: "A vendor fulfills it", detail: "The actual airtime/data/etc. is delivered by a 3rd-party provider" },
  { icon: CheckCircle2, label: "Wallet debited, recorded", detail: "A Transaction row is created — success, pending, or fail" },
];

function FlowDiagram() {
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
      {FLOW_STEPS.map((step, i) => (
        <div key={step.label} className="flex items-stretch shrink-0">
          <div className="w-40 sm:w-44 p-3.5 rounded-xl border border-slate-200/70 bg-white flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center">
              <step.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">{step.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{step.detail}</p>
            </div>
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <div className="flex items-center px-1.5 shrink-0">
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

type Topic = {
  id: string;
  icon: typeof PlugZap;
  title: string;
  summary: string;
  body: string[];
  linkLabel?: string;
  linkPath?: string;
};

const TOPICS: Topic[] = [
  {
    id: "providers",
    icon: PlugZap,
    title: "Providers — who actually delivers airtime/data",
    summary: "The 3rd-party companies (Adex, SME Plug, Ogdams, vtpass…) whose APIs actually top up a customer's phone or pay their bill.",
    body: [
      "A \"Provider\" here means a vendor API — the platform calls it behind the scenes whenever a customer buys airtime, data, cable, or electricity. Each one needs a base URL and API credentials configured before it can be used.",
      "Some providers (grouped under the \"simhost\" type — SME Plug, Ogdams) support syncing their live data plan catalogue automatically via the \"Sync plans\" button, instead of an admin typing in every plan by hand.",
      "If a provider's connection breaks or its balance runs low, purchases through it will start failing — check its status on the Provider page.",
    ],
    linkLabel: "Go to Providers",
    linkPath: "/admin/apis/provider",
  },
  {
    id: "gateways",
    icon: SlidersHorizontal,
    title: "Payment gateways — how money gets in",
    summary: "Flutterwave, Monnify, PaymentPoint, etc. — how a customer actually pays to fund their wallet.",
    body: [
      "A payment gateway is the opposite direction from a provider: instead of paying OUT for a purchase, it's how money comes IN when a customer funds their wallet.",
      "Configure credentials for each gateway here. Whether a configured gateway is actually offered to customers is a separate toggle — see \"Turning things on/off\" below.",
    ],
    linkLabel: "Go to Gateways",
    linkPath: "/admin/apis/gateway",
  },
  {
    id: "products",
    icon: Wifi,
    title: "Products — the things customers can actually buy",
    summary: "Airtime plans, data plans, cable packages, bill/electricity plans, exam pins — and their pricing per customer role.",
    body: [
      "Each sellable item (a \"1GB 30-day MTN\" data plan, a \"DStv Compact\" cable package, etc.) is configured here, and linked to whichever provider actually fulfills it.",
      "Pricing can be set per customer role (e.g. regular \"user\" vs a reseller \"agent\" role pays less) — either a fixed price or a percentage markup over the provider's own cost price.",
    ],
    linkLabel: "Go to Airtime & Data",
    linkPath: "/admin/products/airtime-data",
  },
  {
    id: "customers",
    icon: Users,
    title: "Customers, roles & permissions",
    summary: "Every signed-up user, what role they have, and — for other admins — exactly what they're allowed to do.",
    body: [
      "Every user has a role (e.g. \"user\", \"agent\", \"admin\"). Roles aren't just labels — they can carry their own pricing tier, and (for admin-type roles) a specific set of permissions controlling which admin pages/actions that person can access.",
      "This is also where you'd manually credit or debit a customer's wallet, suspend an account, or look at someone's full transaction history.",
    ],
    linkLabel: "Go to Customers",
    linkPath: "/admin/customers/users",
  },
  {
    id: "transactions",
    icon: Receipt,
    title: "Transactions — the record of everything",
    summary: "Every purchase and every wallet funding creates one row here: pending, success, or fail.",
    body: [
      "This is the single source of truth for \"what happened\" — every airtime purchase, data bundle, cable renewal, wallet top-up, and withdrawal shows up here with a status.",
      "\"Pending\" means the provider hasn't confirmed the outcome yet (common for providers that reply asynchronously via webhook). \"Fail\" means the money was not taken, or was refunded.",
    ],
    linkLabel: "Go to Transactions",
    linkPath: "/admin/transactions",
  },
  {
    id: "growth",
    icon: Gift,
    title: "Growth & marketing — discounts, cashback, promos, events",
    summary: "The tools for making purchases more attractive: flash-sale discounts, automatic cashback, promo codes, and time-boxed events.",
    body: [
      "Discount: an automatic, admin-triggered price cut on a service (optionally scoped to one network), usually time-boxed like a flash sale — customers don't need a code.",
      "Cashback: a flat percentage credited back to a customer's wallet automatically after a successful purchase of a given service type.",
      "Promo codes: opt-in codes a customer enters themselves, with their own eligibility/usage-limit rules — a different mechanism from Discount.",
      "Events: reward campaigns tied to purchase/funding volume over a set window.",
    ],
    linkLabel: "Go to Growth & Marketing",
    linkPath: "/admin/growth/discounts",
  },
  {
    id: "referrals",
    icon: Megaphone,
    title: "Referral program",
    summary: "Customers who refer others earn a commission whenever the referred user makes a successful purchase.",
    body: [
      "Every customer gets a referral code automatically. When someone signs up using it and later completes a purchase, the referrer earns a percentage (configurable) credited to their referral balance — a separate pot from their main wallet.",
      "A customer converts their referral balance into spendable wallet balance themselves, on their own dashboard, whenever they choose.",
    ],
  },
  {
    id: "wallet-ops",
    icon: Landmark,
    title: "Wallet withdrawals & airtime-to-cash",
    summary: "Two ways customers turn value back into cash: withdrawing wallet balance to a bank account, or converting unused airtime.",
    body: [
      "Wallet withdrawals: a customer requests their wallet balance be paid out to a bank account — these show up here for an admin to review and approve.",
      "Airtime-to-cash: a customer sends airtime to a platform-owned number and requests it be converted to wallet cash at a discounted rate — also reviewed and approved by an admin here.",
    ],
    linkLabel: "Go to Wallet Withdrawals",
    linkPath: "/admin/wallet-withdrawals",
  },
  {
    id: "notifications",
    icon: BellRing,
    title: "Notifications & broadcasts",
    summary: "Sending a message to one customer automatically (e.g. \"your purchase succeeded\"), or to many customers at once on purpose.",
    body: [
      "Most notifications (purchase succeeded/failed, referral commission earned, etc.) are sent automatically by the system — nothing to configure.",
      "Broadcast is the deliberate, admin-triggered version: pick an audience (everyone, a specific role, a wallet-balance range, individually-selected users…), write a message, and send it now or schedule it for later, across in-app/email/SMS.",
    ],
    linkLabel: "Go to Broadcast",
    linkPath: "/admin/notifications/broadcast",
  },
  {
    id: "affiliates",
    icon: Network,
    title: "Affiliates — connected child platforms",
    summary: "Separate, independently-run VTU platforms that report their customers/transactions in here, without this platform touching their code.",
    body: [
      "An affiliate is a different app entirely (its own codebase, its own customers) that's been wired up to report into this platform — currently one-way reporting plus a light \"registration\" handshake, not a live remote-control system yet.",
      "To connect a new one: generate a one-time code here (just needs a name), hand it to whoever runs the affiliate app, and they run a single command on their end to exchange it for a real connection.",
      "Once connected, its synced customers and transactions become visible here for review — useful for spotting failed transactions or planning to eventually migrate that affiliate's users onto this platform directly.",
    ],
    linkLabel: "Go to Affiliates",
    linkPath: "/admin/affiliates",
  },
  {
    id: "toggles",
    icon: ToggleLeft,
    title: "Turning things on/off vs. configuring credentials",
    summary: "Two different admin actions that are easy to confuse: entering API credentials, and switching whether that service is actually live.",
    body: [
      "\"APIs > Provider\" and \"APIs > Gateway\" are where you enter the actual connection details (URL, API keys) for a vendor or payment gateway.",
      "\"Payment Gateways\" under Operations (service control) is a separate on/off switch layer — it decides whether an already-configured service is actually offered to customers right now, independent of whether its credentials are correctly set up.",
    ],
    linkLabel: "Go to Service Control",
    linkPath: "/admin/service-control",
  },
];

function AccordionItem({ topic }: { topic: Topic }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
          <topic.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">{topic.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{topic.summary}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pl-15">
          <div className="ml-11 space-y-2.5">
            {topic.body.map((p, i) => (
              <p key={i} className="text-xs text-slate-600 leading-relaxed">
                {p}
              </p>
            ))}
            {topic.linkPath && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(topic.linkPath!)}
              >
                {topic.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GettingStartedPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="How it works"
        description="A simplified walkthrough of the platform — start here if you're new."
      />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">The big picture</h3>
        </div>
        <FlowDiagram />
        <p className="text-xs text-slate-400 mt-3">
          Everything below is one of these steps, zoomed in — a customer needs money in
          their wallet (Payment Gateways) before they can buy something (Products), and every
          purchase needs a Provider willing to actually deliver it.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">Platform areas, explained</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tap any section to expand it.</p>
        </div>
        <div>
          {TOPICS.map((topic) => (
            <AccordionItem key={topic.id} topic={topic} />
          ))}
        </div>
      </Card>
    </div>
  );
}
