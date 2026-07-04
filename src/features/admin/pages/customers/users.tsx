import { useEffect, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
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
  SkeletonLine,
  ConfirmSummary,
  inputCls,
} from "../../../user/components/shared-ui";

type CustomerStatus = "active" | "suspended" | "inactive";
type KycStatus = "verified" | "pending" | "unverified";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  txns: number;
  status: CustomerStatus;
  kyc: KycStatus;
  dateJoined: string;
};

const initialCustomers: Customer[] = [
  { id: "CUS001", name: "Chukwuemeka Obi", email: "emeka.obi@gmail.com", phone: "+234 803 210 4471", balance: 45820, txns: 47, status: "active", kyc: "verified", dateJoined: "2025-11-02" },
  { id: "CUS002", name: "Adaeze Nwosu", email: "adaeze.nwosu@outlook.com", phone: "+234 706 552 8890", balance: 12300, txns: 23, status: "active", kyc: "verified", dateJoined: "2025-12-18" },
  { id: "CUS003", name: "Kunle Adeleke", email: "kunle.adeleke@gmail.com", phone: "+234 812 447 6631", balance: 89700, txns: 112, status: "active", kyc: "pending", dateJoined: "2026-01-09" },
  { id: "CUS004", name: "Fatima Bello", email: "fatima.bello@yahoo.com", phone: "+234 905 331 2204", balance: 5100, txns: 8, status: "suspended", kyc: "verified", dateJoined: "2025-08-27" },
  { id: "CUS005", name: "Tunde Bakare", email: "tunde.bakare@gmail.com", phone: "+234 701 998 3312", balance: 0, txns: 2, status: "inactive", kyc: "unverified", dateJoined: "2026-06-30" },
  { id: "CUS006", name: "Ngozi Eze", email: "ngozi.eze@gmail.com", phone: "+234 814 665 0092", balance: 27650, txns: 34, status: "active", kyc: "verified", dateJoined: "2026-05-14" },
  { id: "CUS007", name: "Ibrahim Musa", email: "ibrahim.musa@hotmail.com", phone: "+234 809 221 7743", balance: 3200, txns: 5, status: "active", kyc: "pending", dateJoined: "2026-06-25" },
  { id: "CUS008", name: "Chidinma Okafor", email: "chidinma.okafor@gmail.com", phone: "+234 703 118 9954", balance: 156400, txns: 201, status: "active", kyc: "verified", dateJoined: "2025-04-11" },
  { id: "CUS009", name: "Segun Owolabi", email: "segun.owolabi@gmail.com", phone: "+234 810 774 3321", balance: 890, txns: 1, status: "suspended", kyc: "unverified", dateJoined: "2026-02-20" },
  { id: "CUS010", name: "Blessing Udo", email: "blessing.udo@gmail.com", phone: "+234 802 556 1187", balance: 18200, txns: 19, status: "active", kyc: "verified", dateJoined: "2026-06-10" },
  { id: "CUS011", name: "Yusuf Abdullahi", email: "yusuf.abdullahi@gmail.com", phone: "+234 816 442 9903", balance: 0, txns: 0, status: "inactive", kyc: "unverified", dateJoined: "2026-06-29" },
  { id: "CUS012", name: "Halima Sani", email: "halima.sani@gmail.com", phone: "+234 708 330 6621", balance: 62100, txns: 58, status: "active", kyc: "verified", dateJoined: "2025-09-30" },
];

const daysAgo = (iso: string) => {
  const diff = Date.parse("2026-07-04") - Date.parse(iso);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

type ModalMode = "view" | "edit" | "create" | null;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  balance: "",
  status: "active" as CustomerStatus,
  kyc: "pending" as KycStatus,
};

const PAGE_SIZE = 6;

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>("all");
  const [kycFilter, setKycFilter] = useState<"all" | KycStatus>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7" | "30" | "90">("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalCustomer, setModalCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [suspendTarget, setSuspendTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesKyc = kycFilter === "all" || c.kyc === kycFilter;
    const matchesDate = dateFilter === "all" || daysAgo(c.dateJoined) <= Number(dateFilter);
    return matchesSearch && matchesStatus && matchesKyc && matchesDate;
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, kycFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const suspendedCustomers = customers.filter((c) => c.status === "suspended").length;
  const newCustomers = customers.filter((c) => daysAgo(c.dateJoined) <= 30).length;

  const hasActiveFilters =
    search !== "" || statusFilter !== "all" || kycFilter !== "all" || dateFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setKycFilter("all");
    setDateFilter("all");
  };

  const openView = (c: Customer) => {
    setModalCustomer(c);
    setModalMode("view");
    setOpenMenuId(null);
  };

  const openEdit = (c: Customer) => {
    setModalCustomer(c);
    setEditForm({ name: c.name, email: c.email, phone: c.phone, balance: String(c.balance), status: c.status, kyc: c.kyc });
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

  const saveCustomer = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    if (modalMode === "edit" && modalCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === modalCustomer.id
            ? { ...c, name: editForm.name, email: editForm.email, phone: editForm.phone, balance: Number(editForm.balance) || 0, status: editForm.status, kyc: editForm.kyc }
            : c,
        ),
      );
    } else if (modalMode === "create") {
      const newCustomer: Customer = {
        id: `CUS${Math.floor(Math.random() * 90000 + 10000)}`,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        balance: Number(editForm.balance) || 0,
        txns: 0,
        status: editForm.status,
        kyc: editForm.kyc,
        dateJoined: "2026-07-04",
      };
      resetFilters();
      setCustomers((prev) => [...prev, newCustomer]);
      setPage(Math.ceil((customers.length + 1) / PAGE_SIZE));
    }
    closeModal();
  };

  const confirmSuspend = () => {
    if (!suspendTarget) return;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === suspendTarget.id
          ? { ...c, status: c.status === "suspended" ? "active" : "suspended" }
          : c,
      ),
    );
    setSuspendTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-8 w-8 rounded-lg" />
              </div>
              <SkeletonLine className="h-6 w-16" />
            </Card>
          ))
        ) : (
          <>
            <StatCard label="Total customers" value={String(totalCustomers)} icon={Users} tone="neutral" meta="All registered users" />
            <StatCard label="Active customers" value={String(activeCustomers)} icon={UserCheck} tone="success" meta="Currently active" />
            <StatCard label="Suspended customers" value={String(suspendedCustomers)} icon={Ban} tone="danger" meta="Access restricted" />
            <StatCard label="New customers" value={String(newCustomers)} icon={UserPlus} tone="neutral" meta="Joined in last 30 days" />
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone"
                className={`${inputCls} pl-9 py-2 text-sm`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className={`${inputCls} py-2 text-sm w-full sm:w-40`}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value as typeof kycFilter)}
              className={`${inputCls} py-2 text-sm w-full sm:w-44`}
            >
              <option value="all">All verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="unverified">Unverified</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className={`${inputCls} py-2 text-sm w-full sm:w-44`}
            >
              <option value="all">Any date joined</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button onClick={resetFilters} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 shrink-0">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine className="h-8 w-8 rounded-full" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-16" />
              </div>
            ))}
          </div>
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
            <table className="w-full text-sm table-fixed min-w-[600px] lg:min-w-0">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-[28%] lg:w-[19%] px-4 py-2 text-left text-xs font-medium text-slate-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Email</th>
                  <th className="hidden lg:table-cell lg:w-[15%] px-4 py-2 text-left text-xs font-medium text-slate-500">Phone</th>
                  <th className="hidden lg:table-cell lg:w-[13%] px-4 py-2 text-right text-xs font-medium text-slate-500">Balance</th>
                  <th className="hidden lg:table-cell lg:w-[7%] px-4 py-2 text-right text-xs font-medium text-slate-500">Txns</th>
                  <th className="w-[26%] lg:w-[13%] px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="hidden lg:table-cell lg:w-[10%] px-4 py-2 text-left text-xs font-medium text-slate-500">Joined</th>
                  <th className="w-14 px-2 py-2 text-center text-xs font-medium text-slate-500 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                          {initials(c.name)}
                        </div>
                        <span className="font-medium text-slate-900 text-xs truncate">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 truncate">{c.email}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.phone}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right font-medium text-slate-900 text-xs tabular-nums whitespace-nowrap">{fmt(c.balance)}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right text-xs text-slate-500">{c.txns}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(c.dateJoined)}</td>
                    <td className="px-2 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === c.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
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
                                onClick={() => { setSuspendTarget(c); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                {c.status === "suspended" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                {c.status === "suspended" ? "Reactivate" : "Suspend"}
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(c); setOpenMenuId(null); }}
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
          <div className="flex flex-col gap-3 px-4 py-3 border-t border-gray-100 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} customers
            </p>
            {totalPages > 1 && (
              <div className="flex items-center flex-wrap gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="p-1.5 rounded-md border border-gray-200 text-slate-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                      currentPage === i + 1 ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="p-1.5 rounded-md border border-gray-200 text-slate-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          </>
        )}
      </Card>

      {/* View / Edit / Create modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-900 text-sm">
                {modalMode === "view" ? "Customer details" : modalMode === "create" ? "Create customer" : "Edit customer"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === "view" && modalCustomer ? (
              <div className="p-4">
                <ConfirmSummary
                  title=""
                  rows={[
                    { label: "Name", value: modalCustomer.name },
                    { label: "Email", value: modalCustomer.email },
                    { label: "Phone", value: modalCustomer.phone },
                    { label: "Wallet balance", value: fmt(modalCustomer.balance) },
                    { label: "Transactions", value: String(modalCustomer.txns) },
                    { label: "Date joined", value: formatDate(modalCustomer.dateJoined) },
                  ]}
                />
                <div className="flex items-center justify-between mb-4 -mt-2 px-1">
                  <StatusBadge status={modalCustomer.status} />
                  <StatusBadge status={modalCustomer.kyc} />
                </div>
                <Button fullWidth onClick={closeModal}>Close</Button>
              </div>
            ) : (
              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Wallet balance</label>
                  <input
                    type="number"
                    value={editForm.balance}
                    onChange={(e) => setEditForm((f) => ({ ...f, balance: e.target.value }))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as CustomerStatus }))}
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Verification status</label>
                  <select
                    value={editForm.kyc}
                    onChange={(e) => setEditForm((f) => ({ ...f, kyc: e.target.value as KycStatus }))}
                    className={inputCls}
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
                  <Button fullWidth disabled={!editForm.name.trim() || !editForm.email.trim()} onClick={saveCustomer}>
                    {modalMode === "create" ? "Create customer" : "Save changes"}
                  </Button>
                </div>
              </div>
            )}
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
                  ? `${suspendTarget.name} will regain full access to their account.`
                  : `${suspendTarget.name} will lose access to their account until reactivated.`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setSuspendTarget(null)}>Cancel</Button>
              <Button variant={suspendTarget.status === "suspended" ? "primary" : "danger"} fullWidth onClick={confirmSuspend}>
                {suspendTarget.status === "suspended" ? "Reactivate" : "Suspend"}
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
                This permanently deletes {deleteTarget.name}'s account and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={confirmDelete}>Delete customer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
