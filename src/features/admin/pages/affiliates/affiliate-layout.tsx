import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Gauge,
  ListChecks,
  Mail,
  Pencil,
  SlidersHorizontal,
  Users,
  Wallet2,
} from "lucide-react";
import {
  Button,
  Card,
  PageHeader,
  SkeletonLine,
  StatusBadge,
} from "../../../user/components/shared-ui";
import { childInstanceService, type ChildInstance } from "./service";

// Everything under /admin/affiliates/:id renders inside this shell — its own
// little admin for one affiliate, with each concern on its own page instead
// of tabs crammed into a single view.

export type AffiliateContext = {
  instance: ChildInstance;
  setInstance: (instance: ChildInstance) => void;
  refreshInstance: () => void;
};

export function useAffiliate() {
  return useOutletContext<AffiliateContext>();
}

const NAV = [
  { to: "", label: "Overview", icon: Gauge, end: true },
  { to: "customers", label: "Customers", icon: Users, end: false },
  { to: "transactions", label: "Transactions", icon: Wallet2, end: false },
  { to: "messages", label: "Messages", icon: Mail, end: false },
  { to: "controls", label: "Controls", icon: SlidersHorizontal, end: false },
  { to: "directives", label: "Directives", icon: ListChecks, end: false },
];

export default function AffiliateLayout() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [instance, setInstance] = useState<ChildInstance | null>(
    (location.state as { instance?: ChildInstance } | null)?.instance ?? null,
  );
  const [loading, setLoading] = useState(!instance);

  const refreshInstance = () => {
    if (!id) return;
    childInstanceService.getById(id).then(setInstance);
  };

  useEffect(() => {
    if (!id) return;
    if (!instance) {
      setLoading(true);
      childInstanceService
        .getById(id)
        .then(setInstance)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonLine className="h-7 w-48" />
        <Card className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonLine key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Affiliate"
          actions={
            <Button variant="secondary" size="sm" onClick={() => navigate("/admin/affiliates")}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Affiliate not found.</p>
          <Button variant="secondary" size="sm" onClick={() => navigate("/admin/affiliates")}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            {instance.name}
            <StatusBadge
              status={
                instance.status === "pending"
                  ? "pending"
                  : instance.status === "active"
                    ? "active"
                    : instance.status === "paused"
                      ? "inactive"
                      : "suspended"
              }
            />
          </span>
        }
        description={instance.base_url ?? "No base URL set"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => navigate("/admin/affiliates")}>
              <ArrowLeft className="w-3.5 h-3.5" /> All affiliates
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/admin/affiliates/${id}/edit`, { state: { instance } })}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-1.5 flex-wrap">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive ? "bg-[#111827] text-white" : "text-slate-500 hover:bg-gray-100"
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ instance, setInstance, refreshInstance } satisfies AffiliateContext} />
    </div>
  );
}
