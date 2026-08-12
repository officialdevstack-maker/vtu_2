import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  ListChecks,
  PlugZap,
  Search,
} from "lucide-react";
import { Button, Card, PageHeader } from "../../../user/components/shared-ui";

type ErrorGuide = {
  customerMessage: string;
  meaning: string;
  likelyCauses: string[];
  checks: string[];
  icon: typeof AlertTriangle;
};

const ERROR_GUIDES: ErrorGuide[] = [
  {
    customerMessage:
      "We could not complete your purchase right now. Please try again later or contact support.",
    meaning:
      "The selected upstream provider explicitly rejected the request or could not fulfil it. Vendify hides the provider's internal funding and infrastructure details from customers.",
    likelyCauses: [
      "The provider account or wallet has insufficient funds.",
      "The provider service is disabled, unavailable, or experiencing an outage.",
      "The provider rejected the request with another definitive failure.",
    ],
    checks: [
      "Open Transactions and find the failed reference to read the full provider response.",
      "Open APIs → Provider and check the selected provider's connection and balance.",
      "Confirm Service Routing points this product type to an active provider.",
    ],
    icon: CircleDollarSign,
  },
  {
    customerMessage:
      "This plan is temporarily unavailable. Please choose another plan or try again later.",
    meaning:
      "Vendify found the customer-facing plan, but the provider selected to fulfil it does not have a usable upstream plan mapping.",
    likelyCauses: [
      "The provider Plan ID, external plan ID, or VTU.ng variation ID is missing.",
      "The provider mapping is disabled or marked unavailable.",
      "The plan is routed to a provider that does not supply that exact bundle.",
    ],
    checks: [
      "Open Transactions and copy the plan number and provider from the detailed error.",
      "Open Products → Airtime & Data → Data Plans and edit that plan's provider mapping.",
      "For a syncing provider such as VTU.ng, run Sync plans and review its imported mappings.",
      "Check mapping priority and availability before retrying the purchase.",
    ],
    icon: ListChecks,
  },
  {
    customerMessage:
      "Your purchase is still processing. Please check your transaction history for updates.",
    meaning:
      "The provider has not returned a final success or failure. Vendify keeps the transaction pending and does not try another provider, preventing duplicate delivery.",
    likelyCauses: [
      "The provider accepted the order for asynchronous processing.",
      "The request timed out or the connection dropped after it may have reached the provider.",
      "Vendify is waiting for a webhook or scheduled status requery.",
    ],
    checks: [
      "Open Transactions and inspect the pending transaction and provider reference.",
      "Check the provider dashboard before manually changing or refunding the transaction.",
      "Confirm provider webhooks and scheduled reconciliation are running.",
      "Do not retry through another provider until non-delivery is confirmed.",
    ],
    icon: Clock3,
  },
];

function GuideCard({ guide }: { guide: ErrorGuide }) {
  const Icon = guide.icon;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Message shown to customers
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-900">
              “{guide.customerMessage}”
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-3">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            What it means
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{guide.meaning}</p>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Likely causes
          </h2>
          <ul className="mt-2 space-y-2">
            {guide.likelyCauses.map((cause) => (
              <li key={cause} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                {cause}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            How to trace it
          </h2>
          <ol className="mt-2 space-y-2">
            {guide.checks.map((check, index) => (
              <li key={check} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                  {index + 1}
                </span>
                {check}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Card>
  );
}

export default function ErrorMessagesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Error messages and meanings"
        description="Translate customer-safe purchase messages into the provider details admins need to investigate."
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <Search className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-950">Start with the transaction reference</p>
            <p className="mt-1 text-xs leading-relaxed text-blue-800">
              Customers see deliberately simplified wording. The admin Transactions page retains the exact
              provider response, provider name, status, and references needed for diagnosis.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate("/admin/transactions")}>
                Open Transactions <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/admin/apis/provider")}>
                <PlugZap className="h-3.5 w-3.5" /> Check Providers
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {ERROR_GUIDES.map((guide) => (
          <GuideCard key={guide.customerMessage} guide={guide} />
        ))}
      </div>

      <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-950">Pending means the outcome is unknown</p>
            <p className="mt-1 text-xs leading-relaxed text-red-800">
              Never send the same purchase through another provider merely because the first request timed out.
              Confirm failure through the provider dashboard, webhook, or requery first to avoid delivering twice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
