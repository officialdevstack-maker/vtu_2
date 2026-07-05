import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  ShieldCheck,
  Trash2,
  Users,
  UserCheck,
  UserPlus,
  X,
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
import { usePagination } from "../../../../shared/pagination";
import { customerService, type Customer } from "./service";

type CustomerStatus = "active" | "suspended" | "inactive";
type KycStatus = "verified" | "pending" | "unverified";

const initialCustomers: Customer[] = [
  {
    id: "CUS001",
    name: "Chukwuemeka Obi",
    email: "emeka.obi@gmail.com",
    phone: "+234 803 210 4471",
    balance: 45820,
    txns: 47,
    status: "active",
    kyc: "verified",
    dateJoined: "2025-11-02",
  },
  {
    id: "CUS002",
    name: "Adaeze Nwosu",
    email: "adaeze.nwosu@outlook.com",
    phone: "+234 706 552 8890",
    balance: 12300,
    txns: 23,
    status: "active",
    kyc: "verified",
    dateJoined: "2025-12-18",
  },
  {
    id: "CUS003",
    name: "Kunle Adeleke",
    email: "kunle.adeleke@gmail.com",
    phone: "+234 812 447 6631",
    balance: 89700,
    txns: 112,
    status: "active",
    kyc: "pending",
    dateJoined: "2026-01-09",
  },
  {
    id: "CUS004",
    name: "Fatima Bello",
    email: "fatima.bello@yahoo.com",
    phone: "+234 905 331 2204",
    balance: 5100,
    txns: 8,
    status: "suspended",
    kyc: "verified",
    dateJoined: "2025-08-27",
  },
  {
    id: "CUS005",
    name: "Tunde Bakare",
    email: "tunde.bakare@gmail.com",
    phone: "+234 701 998 3312",
    balance: 0,
    txns: 2,
    status: "inactive",
    kyc: "unverified",
    dateJoined: "2026-06-30",
  },
  {
    id: "CUS006",
    name: "Ngozi Eze",
    email: "ngozi.eze@gmail.com",
    phone: "+234 814 665 0092",
    balance: 27650,
    txns: 34,
    status: "active",
    kyc: "verified",
    dateJoined: "2026-05-14",
  },
  {
    id: "CUS007",
    name: "Ibrahim Musa",
    email: "ibrahim.musa@hotmail.com",
    phone: "+234 809 221 7743",
    balance: 3200,
    txns: 5,
    status: "active",
    kyc: "pending",
    dateJoined: "2026-06-25",
  },
  {
    id: "CUS008",
    name: "Chidinma Okafor",
    email: "chidinma.okafor@gmail.com",
    phone: "+234 703 118 9954",
    balance: 156400,
    txns: 201,
    status: "active",
    kyc: "verified",
    dateJoined: "2025-04-11",
  },
  {
    id: "CUS009",
    name: "Segun Owolabi",
    email: "segun.owolabi@gmail.com",
    phone: "+234 810 774 3321",
    balance: 890,
    txns: 1,
    status: "suspended",
    kyc: "unverified",
    dateJoined: "2026-02-20",
  },
  {
    id: "CUS010",
    name: "Blessing Udo",
    email: "blessing.udo@gmail.com",
    phone: "+234 802 556 1187",
    balance: 18200,
    txns: 19,
    status: "active",
    kyc: "verified",
    dateJoined: "2026-06-10",
  },
  {
    id: "CUS011",
    name: "Yusuf Abdullahi",
    email: "yusuf.abdullahi@gmail.com",
    phone: "+234 816 442 9903",
    balance: 0,
    txns: 0,
    status: "inactive",
    kyc: "unverified",
    dateJoined: "2026-06-29",
  },
  {
    id: "CUS012",
    name: "Halima Sani",
    email: "halima.sani@gmail.com",
    phone: "+234 708 330 6621",
    balance: 62100,
    txns: 58,
    status: "active",
    kyc: "verified",
    dateJoined: "2025-09-30",
  },
];

const daysAgo = (iso?: string) => {
  if (!iso) return 9999;
  const diff = Date.parse("2026-07-04") - Date.parse(iso);
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

type ModalMode = "edit" | "create" | null;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  balance: "",
  status: "active" as CustomerStatus,
  kyc: "pending" as KycStatus,
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );
  const [kycFilter, setKycFilter] = useState<"all" | KycStatus>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7" | "30" | "90">(
    "all",
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalCustomer, setModalCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [suspendTarget, setSuspendTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCustomers = async () => {
      try {
        const response = await customerService.getAll();
        if (mounted) {
          console.log(response)
          setCustomers(response.length ? response : initialCustomers);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError(
            "Could not load customer data from the API. Showing the cached list instead.",
          );
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

  const openView = (c: Customer) => {
    setOpenMenuId(null);
    navigate(`/admin/customers/users/${c.id}`, { state: { customer: c } });
  };

  const openEdit = (c: Customer) => {
    setModalCustomer(c);
    setEditForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      balance: String(c.balance),
      status: c.status,
      kyc: c.kyc,
    });
    setModalMode("edit");
    setOpenMenuId(null);
  };

  const openCreate = () => {
    setModalCustomer(null);
    setEditForm(emptyForm);
    setModalMode("create");
  };

  const closeModal = () => {
    setModalCustomer(null);
    setModalMode(null);
  };

  const saveCustomer = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    setSaving(true);
    setError(null);

    try {
      if (modalMode === "edit" && modalCustomer) {
        const updated = await customerService.update(modalCustomer.id, {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          balance: Number(editForm.balance) || 0,
          status: editForm.status,
          kyc: editForm.kyc,
        });
        setCustomers((prev) =>
          prev.map((c) => (c.id === modalCustomer.id ? updated : c)),
        );
      } else if (modalMode === "create") {
        const created = await customerService.create({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          balance: Number(editForm.balance) || 0,
          status: editForm.status,
          kyc: editForm.kyc,
        });
        resetFilters();
        setCustomers((prev) => [created, ...prev]);
        setCustomerPage(1);
      }
      closeModal();
    } catch {
      setError("The customer could not be saved right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
            description="Try adjusting your search or filters"
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
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
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                            {initials(c.username || c.name)}
                          </div>
                          <span className="font-medium text-slate-900 text-xs whitespace-nowrap">
                            {c.username || c.name}
                          </span>
                        </div>
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
                      <td className="px-4 py-3">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === c.id ? null : c.id)
                            }
                            className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openMenuId === c.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                <button
                                  onClick={() => openView(c)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  onClick={() => openEdit(c)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setSuspendTarget(c);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                >
                                  {c.status === "suspended" ? (
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                  )}
                                  {c.status === "suspended"
                                    ? "Reactivate"
                                    : "Suspend"}
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget(c);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
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

      {/* Edit / Create modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-900 text-sm">
                {modalMode === "create" ? "Create customer" : "Edit customer"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Full name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Email
                  </label>
                  <input
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Phone
                  </label>
                  <input
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Wallet balance
                  </label>
                  <input
                    type="number"
                    value={editForm.balance}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, balance: e.target.value }))
                    }
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        status: e.target.value as CustomerStatus,
                      }))
                    }
                    className={selectCls}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Verification status
                  </label>
                  <select value={editForm.kyc} disabled className={`${selectCls} bg-gray-50 text-slate-400`}>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="unverified">Unverified</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Read-only — determined by the customer's email verification, not editable here.
                  </p>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    loading={saving}
                    disabled={
                      !editForm.name.trim() || !editForm.email.trim() || saving
                    }
                    onClick={saveCustomer}
                  >
                    {saving
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Create customer"
                        : "Save changes"}
                  </Button>
                </div>
              </div>
          </div>
        </div>
      )}

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
