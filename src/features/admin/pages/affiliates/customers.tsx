import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock3,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Pagination,
  SkeletonRows,
  StatusBadge,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import { DEFAULT_PAGE_SIZE } from "@shared/pagination";
import { useLocalStorageState } from "@/shared/utils";
import {
  childCustomerService,
  type ChildCustomer,
  type ActivityPeriod,
  type RecentlyActiveCustomer,
  type PaginatedMeta,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import {
  EmailCustomerModal,
  MigrateCustomerModal,
  BulkEmailModal,
  BulkMigrateModal,
  fmt,
} from "./modals";

type CustomerSortKey =
  "external_id" | "username" | "email" | "phone" | "wallet_balance" | "status";

type CustomerSortState = { key: CustomerSortKey; direction: "asc" | "desc" };

const activityPeriods: { value: ActivityPeriod; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All recent" },
];

function formatTransactionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function serviceLabel(value: string | null): string {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Service";
}

function RecentlyActiveCustomers({ instanceId }: { instanceId: string }) {
  const [period, setPeriod] = useState<ActivityPeriod>("30d");
  const [rows, setRows] = useState<RecentlyActiveCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    childCustomerService.getRecentActivity(instanceId, period, 20)
      .then((result) => {
        if (current) setRows(result.customers);
      })
      .catch(() => {
        if (current) {
          setRows([]);
          setError(true);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [instanceId, period]);

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recently Active Customers
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Latest successful MadiTel service purchase per customer
          </p>
        </div>
        <select
          aria-label="Activity period"
          value={period}
          onChange={(event) => setPeriod(event.target.value as ActivityPeriod)}
          className={`${selectCls} sm:ml-auto`}
        >
          {activityPeriods.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-5"><SkeletonRows count={4} withAvatar={false} /></div>
      ) : error ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">Recent activity is temporarily unavailable.</p>
          <p className="mt-1 text-xs text-slate-400">The synced customer list below is still available.</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No MadiTel customer transactions found in this period."
          description="Choose a wider activity period to look further back."
        />
      ) : (
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[1050px] w-full table-fixed text-xs">
            <thead><tr className="border-b border-gray-100">
              <th className="w-44 px-4 py-2.5 text-left font-medium text-slate-400">Customer</th>
              <th className="w-52 px-4 py-2.5 text-left font-medium text-slate-400">Contact</th>
              <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400">External ID</th>
              <th className="w-48 px-4 py-2.5 text-left font-medium text-slate-400">Latest transaction</th>
              <th className="w-36 px-4 py-2.5 text-left font-medium text-slate-400">Service</th>
              <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400">Amount</th>
              <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400">Status</th>
              <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400">Migration</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.username ?? "Unnamed customer"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <span className="block truncate">{row.email ?? "—"}</span>
                    <span className="block truncate text-[11px] text-slate-400">{row.phone ?? "—"}</span>
                  </td>
                  <td className="truncate px-4 py-3 font-mono text-slate-500">{row.external_id}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-800">{formatTransactionDate(row.latest_transaction_at)}</td>
                  <td className="px-4 py-3 text-slate-600">{serviceLabel(row.latest_transaction_type)}</td>
                  <td className="px-4 py-3 font-medium tabular-nums text-slate-700">{fmt(row.latest_transaction_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.latest_transaction_status} /></td>
                  <td className="px-4 py-3">
                    {row.migrated_to_user_id ? (
                      <Link to={`/admin/customers/users/${row.migrated_to_user_id}`} className="font-medium text-emerald-600 hover:underline">Migrated</Link>
                    ) : (
                      <span className="font-medium text-amber-600">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AffiliateCustomersPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [customers, setCustomers] = useState<ChildCustomer[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useLocalStorageState<string>(
    `affiliate:${id}:customers:query`,
    "",
  );
  const [sort, setSort] = useLocalStorageState<CustomerSortState>(
    `affiliate:${id}:customers:sort`,
    { key: "external_id", direction: "asc" },
  );
  const [statusFilter, setStatusFilter] = useLocalStorageState<string>(
    `affiliate:${id}:customers:statusFilter`,
    "all",
  );
  const [walletMin, setWalletMin] = useLocalStorageState<string>(
    `affiliate:${id}:customers:walletMin`,
    "",
  );
  const [walletMax, setWalletMax] = useLocalStorageState<string>(
    `affiliate:${id}:customers:walletMax`,
    "",
  );
  const [signedUpAfter, setSignedUpAfter] = useLocalStorageState<string>(
    `affiliate:${id}:customers:signedUpAfter`,
    "",
  );
  const [signedUpBefore, setSignedUpBefore] = useLocalStorageState<string>(
    `affiliate:${id}:customers:signedUpBefore`,
    "",
  );
  const [page, setPage] = useLocalStorageState<number>(
    `affiliate:${id}:customers:page`,
    1,
  );
  const [migrateTarget, setMigrateTarget] = useState<ChildCustomer | null>(
    null,
  );
  const [emailTarget, setEmailTarget] = useState<ChildCustomer | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMigrateOpen, setBulkMigrateOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);

  const toggleSort = (key: CustomerSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  };

  const refresh = () => {
    childCustomerService
      .getPaginatedByInstance(id, {
        query: query.trim() || undefined,
        sort: `${sort.key},${sort.direction}`,
        page,
        per_page: DEFAULT_PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        wallet_balance_min: walletMin.trim() || undefined,
        wallet_balance_max: walletMax.trim() || undefined,
        created_at_after: signedUpAfter || undefined,
        created_at_before: signedUpBefore || undefined,
      })
      .then(({ data, meta: nextMeta }) => {
        setCustomers(data);
        setMeta(nextMeta);
      });
  };

  useEffect(() => {
    setLoading(true);
    childCustomerService
      .getPaginatedByInstance(id, {
        query: query.trim() || undefined,
        sort: `${sort.key},${sort.direction}`,
        page,
        per_page: DEFAULT_PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        wallet_balance_min: walletMin.trim() || undefined,
        wallet_balance_max: walletMax.trim() || undefined,
        created_at_after: signedUpAfter || undefined,
        created_at_before: signedUpBefore || undefined,
      })
      .then(({ data, meta: nextMeta }) => {
        setCustomers(data);
        setMeta(nextMeta);
      })
      .finally(() => setLoading(false));
  }, [
    id,
    query,
    sort,
    statusFilter,
    walletMin,
    walletMax,
    signedUpAfter,
    signedUpBefore,
    page,
  ]);

  const statuses = useMemo(
    () =>
      [
        "all",
        statusFilter !== "all" ? statusFilter : undefined,
        ...new Set(customers.map((c) => c.status).filter(Boolean)),
      ].filter(Boolean) as string[],
    [customers, statusFilter],
  );

  const pageItems = customers;
  const pageItemIds = pageItems.map((c) => String(c.id));
  const selectedSet = new Set(selectedIds);
  const pageSelectedCount = pageItemIds.filter((id) => selectedSet.has(id)).length;
  const allPageSelected = pageItemIds.length > 0 && pageSelectedCount === pageItemIds.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;
  const currentPage = meta?.current_page ?? page;
  const totalPages = meta?.last_page ?? 1;
  const totalItems = meta?.total ?? customers.length;
  const pageSize = meta?.per_page ?? DEFAULT_PAGE_SIZE;

  return (
    <div className="space-y-5">
      <RecentlyActiveCustomers instanceId={id} />
      <Card>
        <div className="border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            All MadiTel Customers{" "}
            {customers.length > 0 && (
              <span className="text-slate-400 normal-case font-normal">
                — {customers.length} synced
              </span>
            )}
          </h2>
          <div className="relative flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:ml-auto lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search id, name, email, phone…"
                className={`${inputCls} pl-8 w-full`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="number"
                min="0"
                value={walletMin}
                onChange={(e) => {
                  setWalletMin(e.target.value);
                  setPage(1);
                }}
                placeholder="Min balance"
                className={inputCls}
              />
              <input
                type="number"
                min="0"
                value={walletMax}
                onChange={(e) => {
                  setWalletMax(e.target.value);
                  setPage(1);
                }}
                placeholder="Max balance"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={signedUpAfter}
                onChange={(e) => {
                  setSignedUpAfter(e.target.value);
                  setPage(1);
                }}
                className={inputCls}
              />
              <input
                type="date"
                value={signedUpBefore}
                onChange={(e) => {
                  setSignedUpBefore(e.target.value);
                  setPage(1);
                }}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-5">
            <SkeletonRows count={6} withAvatar={false} />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              query
                ? "No customers match your search"
                : "No synced customers yet"
            }
            description={
              query
                ? "Try a different search term."
                : "They'll appear here once the affiliate's cron pushes a batch."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[980px] w-full table-fixed text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-12 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={allPageSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = somePageSelected;
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const pageIds = new Set(pageItemIds);
                          if (e.target.checked) {
                            setSelectedIds((current) => [
                              ...current,
                              ...pageItemIds.filter((id) => !current.includes(id)),
                            ]);
                          } else {
                            setSelectedIds((current) => current.filter((id) => !pageIds.has(id)));
                          }
                        }}
                      />
                    </th>
                    <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleSort("external_id")}
                      >
                        External ID
                        {sort.key === "external_id" &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </button>
                    </th>
                    <th className="w-36 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleSort("username")}
                      >
                        Username
                        {sort.key === "username" &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </button>
                    </th>
                    <th className="w-56 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleSort("email")}
                      >
                        Email
                        {sort.key === "email" &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </button>
                    </th>
                    <th className="w-36 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleSort("phone")}
                      >
                        Phone
                        {sort.key === "phone" &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </button>
                    </th>
                    <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleSort("wallet_balance")}
                      >
                        Balance
                        {sort.key === "wallet_balance" &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </button>
                    </th>
                    <th className="w-28 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleSort("status")}
                      >
                        Status
                        {sort.key === "status" &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </button>
                    </th>
                    <th className="w-48 px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                      Parent account
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageItems.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(String(c.id))}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const id = String(c.id);
                            if (e.target.checked)
                              setSelectedIds((s) => (s.includes(id) ? s : [...s, id]));
                            else
                              setSelectedIds((s) =>
                                s.filter((selectedId) => selectedId !== id),
                              );
                          }}
                        />
                      </td>
                      <td className="truncate px-4 py-3 font-mono text-slate-500">
                        {c.external_id}
                      </td>
                      <td className="truncate px-4 py-3 text-slate-700">
                        {c.username ?? "—"}
                      </td>
                      <td className="truncate px-4 py-3 text-slate-500">
                        {c.email ?? "—"}
                      </td>
                      <td className="truncate px-4 py-3 text-slate-500">
                        {c.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {fmt(c.wallet_balance)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status ?? "pending"} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-3">
                          {c.migrated_to_user_id ? (
                            <Link
                              to={`/admin/customers/users/${c.migrated_to_user_id}`}
                              className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Migrated
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setMigrateTarget(c)}
                              className="inline-flex items-center gap-1 text-[#111827] font-medium hover:underline"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" /> Migrate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEmailTarget(c)}
                            disabled={!c.email}
                            title={
                              c.email
                                ? `Email ${c.email}`
                                : "No email synced for this customer"
                            }
                            className="inline-flex items-center gap-1 text-slate-500 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
                          >
                            <Mail className="w-3.5 h-3.5" /> Email
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 p-3 sm:flex-row sm:items-center">
                <div className="text-sm text-slate-700">
                  {selectedIds.length} selected
                </div>
                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setBulkEmailOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:w-auto"
                  >
                    <Mail className="h-3.5 w-3.5" /> Migrate then email
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMigrateOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:w-auto"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Migrate selected
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              label="customers"
            />
          </>
        )}
      </Card>

      {migrateTarget && (
        <MigrateCustomerModal
          instanceId={id}
          customer={migrateTarget}
          onClose={() => setMigrateTarget(null)}
          onMigrated={refresh}
        />
      )}

      {emailTarget && (
        <EmailCustomerModal
          instanceId={id}
          customer={emailTarget}
          onClose={() => setEmailTarget(null)}
        />
      )}

      {bulkMigrateOpen && (
        <BulkMigrateModal
          instanceId={id}
          customerIds={selectedIds}
          customers={customers.filter((c) => selectedSet.has(String(c.id)))}
          onClose={() => setBulkMigrateOpen(false)}
          onDone={() => {
            setSelectedIds([]);
            setBulkMigrateOpen(false);
            refresh();
          }}
        />
      )}

      {bulkEmailOpen && (
        <BulkEmailModal
          instanceId={id}
          customerIds={selectedIds}
          onClose={() => setBulkEmailOpen(false)}
          onSent={() => {
            refresh();
          }}
        />
      )}
    </div>
  );
}
