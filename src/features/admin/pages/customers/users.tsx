import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Pencil,
  Ban,
  ShieldCheck,
  Trash2,
  Users,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { fmt } from "../../../user/data/mock";
import {
  PageHeader,
  StatCard,
  Card,
  Button,
  StatusBadge,
  EmptyState,
  Pagination,
  SkeletonRows,
  SkeletonStatGrid,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import { ActionMenu } from "../../../../shared/components/action-menu";
import { usePagination } from "../../../../shared/pagination";
import { customerService, type Customer } from "./service";

type CustomerStatus = "active" | "suspended" | "inactive";
type KycStatus = "verified" | "pending" | "unverified";

const daysAgo = (iso?: string) => {
  if (!iso) return 9999;
  const diff = Date.now() - Date.parse(iso);
  return Number.isFinite(diff)
    ? Math.floor(diff / (1000 * 60 * 60 * 24))
    : 9999;
};

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function CustomersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );
  const [kycFilter, setKycFilter] = useState<"all" | KycStatus>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7" | "30" | "90">(
    "all",
  );
  const [suspendTarget, setSuspendTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCustomers = async () => {
      try {
        const response = await customerService.getAll();
        if (mounted) {
          setCustomers(response);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Could not load customer data from the API.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (c.username ?? "").toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesKyc = kycFilter === "all" || c.kyc === kycFilter;
    const matchesDate =
      dateFilter === "all" || daysAgo(c.dateJoined) <= Number(dateFilter);
    return matchesSearch && matchesStatus && matchesKyc && matchesDate;
  });

  const {
    currentPage,
    pageItems: paginated,
    pageSize,
    setPage: setCustomerPage,
    totalItems,
    totalPages,
  } = usePagination(filtered);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const suspendedCustomers = customers.filter(
    (c) => c.status === "suspended",
  ).length;
  const newCustomers = customers.filter(
    (c) => daysAgo(c.dateJoined) <= 30,
  ).length;

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    kycFilter !== "all" ||
    dateFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setKycFilter("all");
    setDateFilter("all");
    setCustomerPage(1);
  };

  const openView = (c: Customer) =>
    navigate(`/admin/customers/users/${c.id}`, { state: { customer: c } });

  const openEdit = (c: Customer) =>
    navigate(`/admin/customers/users/${c.id}/edit`, { state: { customer: c } });

  const openCreate = () => navigate("/admin/customers/users/new");

  const menuItems = (c: Customer) => [
    { label: "View", icon: Eye, onClick: () => openView(c) },
    { label: "Edit", icon: Pencil, onClick: () => openEdit(c) },
    {
      label: c.status === "suspended" ? "Reactivate" : "Suspend",
      icon: c.status === "suspended" ? ShieldCheck : Ban,
      onClick: () => setSuspendTarget(c),
    },
    {
      label: "Delete",
      icon: Trash2,
      tone: "danger" as const,
      separatorBefore: true,
      onClick: () => setDeleteTarget(c),
    },
  ];

  const confirmSuspend = async () => {
    if (!suspendTarget) return;

    try {
      const updated = await customerService.toggleStatus(suspendTarget);
      setCustomers((prev) =>
        prev.map((c) => (c.id === suspendTarget.id ? updated : c)),
      );
    } catch {
      setError("The account status could not be changed right now.");
    } finally {
      setSuspendTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await customerService.remove(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch {
      setError("The customer could not be deleted right now.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="All customers"
        description="View, search, and manage every registered customer on the platform"
        actions={
          <Button onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="w-4 h-4" /> Create Customer
          </Button>
        }
      />
      <Button onClick={openCreate} fullWidth className="sm:hidden">
        <Plus className="w-4 h-4" /> Create Customer
      </Button>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <SkeletonStatGrid count={4} className="contents" />
        ) : (
          <>
            <StatCard
              label="Total customers"
              value={String(totalCustomers)}
              icon={Users}
              tone="neutral"
              meta="All registered users"
            />
            <StatCard
              label="Active customers"
              value={String(activeCustomers)}
              icon={UserCheck}
              tone="success"
              meta="Currently active"
            />
            <StatCard
              label="Suspended customers"
              value={String(suspendedCustomers)}
              icon={Ban}
              tone="danger"
              meta="Access restricted"
            />
            <StatCard
              label="New customers"
              value={String(newCustomers)}
              icon={UserPlus}
              tone="neutral"
              meta="Joined in last 30 days"
            />
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCustomerPage(1);
                }}
                placeholder="Search by name, email, or phone"
                className={`${inputCls} pl-9 py-2 text-sm`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setCustomerPage(1);
              }}
              className={`${selectCls} py-2 text-sm w-full sm:w-40`}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={kycFilter}
              onChange={(e) => {
                setKycFilter(e.target.value as typeof kycFilter);
                setCustomerPage(1);
              }}
              className={`${selectCls} py-2 text-sm w-full sm:w-44`}
            >
              <option value="all">All verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="unverified">Unverified</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as typeof dateFilter);
                setCustomerPage(1);
              }}
              className={`${selectCls} py-2 text-sm w-full sm:w-44`}
            >
              <option value="all">Any date joined</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="text-xs text-[#111827] font-medium hover:text-[#111827] shrink-0"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <SkeletonRows count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters"
                : "Newly registered customers will appear here"
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="w-3.5 h-3.5" /> Create customer
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {paginated.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openView(c)}
                      className="min-w-0 flex flex-1 items-center gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827]/10 text-xs font-medium text-[#111827]">
                        {initials(c.username || c.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {c.username || c.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{c.email}</p>
                      </div>
                    </button>

                    <div className="shrink-0">
                      <ActionMenu items={menuItems(c)} />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="mt-0.5 truncate font-medium text-slate-700">
                        {c.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Wallet</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
                        {fmt(c.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Transactions</p>
                      <p className="mt-0.5 font-medium tabular-nums text-slate-700">
                        {c.txns}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Joined</p>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {formatDate(c.dateJoined)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusBadge status={c.status} />
                    <StatusBadge status={c.kyc} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Username",
                      "Email",
                      "Phone",
                      "Wallet balance",
                      "Transactions",
                      "Status",
                      "Date joined",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-2 text-xs font-medium text-slate-500 whitespace-nowrap ${
                          h === "Wallet balance" || h === "Transactions"
                            ? "text-right"
                            : h === "Actions"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openView(c)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <div className="w-7 h-7 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                            {initials(c.username || c.name)}
                          </div>
                          <span className="font-medium text-slate-900 text-xs whitespace-nowrap hover:underline">
                            {c.username || c.name}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {c.email}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {c.phone}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 text-xs tabular-nums">
                        {fmt(c.balance)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
                        {c.txns}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(c.dateJoined)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ActionMenu items={menuItems(c)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCustomerPage}
              label="records"
            />
          </>
        )}
      </Card>

      {/* Suspend / reactivate confirm */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
            <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {suspendTarget.status === "suspended"
                  ? `${suspendTarget.username || suspendTarget.name} will regain full access to their account.`
                  : `${suspendTarget.username || suspendTarget.name} will lose access to their account until reactivated.`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSuspendTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant={
                  suspendTarget.status === "suspended" ? "primary" : "danger"
                }
                fullWidth
                onClick={confirmSuspend}
              >
                {suspendTarget.status === "suspended"
                  ? "Reactivate"
                  : "Suspend"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
            <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                This permanently deletes {deleteTarget.username || deleteTarget.name}'s account and
                cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" fullWidth loading={deleting} disabled={deleting} onClick={confirmDelete}>
                {deleting ? "" : "Delete customer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
