import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, Mail, Search, UserCheck, Users } from "lucide-react";
import {
  Card,
  EmptyState,
  Pagination,
  SkeletonRows,
  StatusBadge,
  inputCls,
} from "../../../user/components/shared-ui";
import { usePagination } from "@shared/pagination";
import { childCustomerService, type ChildCustomer } from "./service";
import { useAffiliate } from "./affiliate-layout";
import { EmailCustomerModal, MigrateCustomerModal, fmt } from "./modals";

export default function AffiliateCustomersPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [customers, setCustomers] = useState<ChildCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [migrateTarget, setMigrateTarget] = useState<ChildCustomer | null>(null);
  const [emailTarget, setEmailTarget] = useState<ChildCustomer | null>(null);

  const refresh = () => {
    childCustomerService.getByInstance(id).then(setCustomers);
  };

  useEffect(() => {
    setLoading(true);
    childCustomerService
      .getByInstance(id)
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.external_id, c.username, c.email, c.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [customers, query]);

  const { pageItems, currentPage, totalPages, totalItems, pageSize, setPage } =
    usePagination(filtered);

  return (
    <div className="space-y-5">
      <Card>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Customers {customers.length > 0 && <span className="text-slate-400 normal-case font-normal">— {customers.length} synced</span>}
          </h2>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search id, name, email, phone…"
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-5">
            <SkeletonRows count={6} withAvatar={false} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query ? "No customers match your search" : "No synced customers yet"}
            description={query ? "Try a different search term." : "They'll appear here once the affiliate's cron pushes a batch."}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["External ID", "Username", "Email", "Phone", "Balance", "Status", "Parent account"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageItems.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">{c.external_id}</td>
                      <td className="px-4 py-3 text-slate-700">{c.username ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{c.email ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">{fmt(c.wallet_balance)}</td>
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
                            title={c.email ? `Email ${c.email}` : "No email synced for this customer"}
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
