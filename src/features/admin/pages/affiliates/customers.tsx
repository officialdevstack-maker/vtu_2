import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Mail,
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
  type PaginatedMeta,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import { EmailCustomerModal, MigrateCustomerModal, fmt } from "./modals";

type CustomerSortKey =
  "external_id" | "username" | "email" | "phone" | "wallet_balance" | "status";

type CustomerSortState = { key: CustomerSortKey; direction: "asc" | "desc" };

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
  const [page, setPage] = useLocalStorageState<number>(
    `affiliate:${id}:customers:page`,
    1,
  );
  const [migrateTarget, setMigrateTarget] = useState<ChildCustomer | null>(
    null,
  );
  const [emailTarget, setEmailTarget] = useState<ChildCustomer | null>(null);

  const toggleSort = (key: CustomerSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  };

  const sortValue = (customer: ChildCustomer, key: CustomerSortKey) => {
    switch (key) {
      case "wallet_balance":
        return Number(customer.wallet_balance) || 0;
      case "external_id":
        return customer.external_id ?? "";
      case "username":
        return customer.username ?? "";
      case "email":
        return customer.email ?? "";
      case "phone":
        return customer.phone ?? "";
      case "status":
        return customer.status ?? "";
      default:
        return "";
    }
  };

  const refresh = () => {
    childCustomerService
      .getPaginatedByInstance(id, {
        query: query.trim() || undefined,
        sort: `${sort.key},${sort.direction}`,
        page,
        per_page: DEFAULT_PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
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
      })
      .then(({ data, meta: nextMeta }) => {
        setCustomers(data);
        setMeta(nextMeta);
      })
      .finally(() => setLoading(false));
  }, [id, query, sort, statusFilter, page]);

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
  const currentPage = meta?.current_page ?? page;
  const totalPages = meta?.last_page ?? 1;
  const totalItems = meta?.total ?? customers.length;
  const pageSize = meta?.per_page ?? DEFAULT_PAGE_SIZE;

  return (
    <div className="space-y-5">
      <Card>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Customers{" "}
            {customers.length > 0 && (
              <span className="text-slate-400 normal-case font-normal">
                — {customers.length} synced
              </span>
            )}
          </h2>
          <div className="relative ml-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:w-auto w-full">
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

        {loading ? (
          <div className="p-5">
            <SkeletonRows count={6} withAvatar={false} />
          </div>
        ) : filtered.length === 0 ? (
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
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
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
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {c.external_id}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {c.username ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {c.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
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
    </div>
  );
}
