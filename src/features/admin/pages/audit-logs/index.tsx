import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  History,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  SkeletonLine,
  inputCls,
} from "../../../user/components/shared-ui";
import { useTableQueryState } from "@shared/table-query-state";
import {
  auditLogService,
  type AuditChange,
  type AuditFilters,
  type AuditLog,
} from "./service";

const PER_PAGE = 25;

// Colour by intent, not by name — deletes should read as dangerous at a glance.
const ACTION_STYLES: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-700 border-emerald-200",
  updated: "bg-blue-50 text-blue-700 border-blue-200",
  deleted: "bg-red-50 text-red-700 border-red-200",
  login: "bg-slate-100 text-slate-600 border-slate-200",
  logout: "bg-slate-100 text-slate-600 border-slate-200",
};

const actionStyle = (action: string) =>
  ACTION_STYLES[action] ?? "bg-violet-50 text-violet-700 border-violet-200";

const prettyAction = (action: string) => action.replace(/_/g, " ");

/** A {old,new} pair, as opposed to a flat create/delete snapshot value. */
function isDiff(value: unknown): value is AuditChange {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("old" in value || "new" in value)
  );
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const fieldLabel = (field: string) =>
  field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function ChangeTable({ changes }: { changes: Record<string, unknown> }) {
  const entries = Object.entries(changes);
  if (entries.length === 0) {
    return <p className="text-xs text-slate-400">No field details recorded.</p>;
  }

  const hasDiff = entries.some(([, v]) => isDiff(v));

  return (
    <div className="overflow-x-auto">
      {/* A diff needs room for before + after columns; a flat snapshot has just
          one value column, so it can fit narrow screens without scrolling. */}
      <table
        className={`w-full text-xs ${hasDiff ? "min-w-[420px]" : "min-w-0"}`}
      >
        <thead>
          <tr className="text-left text-slate-400">
            <th className="pb-1.5 pr-4 font-medium">Field</th>
            {hasDiff && <th className="pb-1.5 pr-4 font-medium">Before</th>}
            <th className="pb-1.5 font-medium">{hasDiff ? "After" : "Value"}</th>
          </tr>
        </thead>
        <tbody className="align-top">
          {entries.map(([field, value]) => (
            <tr key={field} className="border-t border-slate-100">
              <td className="py-1.5 pr-4 font-medium text-slate-600">
                {fieldLabel(field)}
              </td>
              {hasDiff && (
                <td className="py-1.5 pr-4">
                  <span className="break-all text-slate-400 line-through">
                    {renderValue(isDiff(value) ? value.old : undefined)}
                  </span>
                </td>
              )}
              <td className="py-1.5">
                <span className="break-all font-medium text-slate-700">
                  {renderValue(isDiff(value) ? value.new : value)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(log.changes || log.context || log.ip_address);

  return (
    <li className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        disabled={!hasDetail}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
          hasDetail ? "hover:bg-slate-50" : "cursor-default"
        }`}
      >
        <span className="mt-0.5 shrink-0 text-slate-300">
          {hasDetail ? (
            open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="block h-4 w-4" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${actionStyle(
                log.action,
              )}`}
            >
              {prettyAction(log.action)}
            </span>
            <span className="min-w-0 break-words text-sm text-slate-700">
              {log.description ??
                `${prettyAction(log.action)} ${log.subject_label ?? ""}`.trim()}
            </span>
          </span>
          <span className="mt-1 block text-xs text-slate-400">
            {log.actor.name}
            {log.subject_type && (
              <>
                {" · "}
                {log.subject_type}
                {log.subject_id ? ` #${log.subject_id}` : ""}
              </>
            )}
            {/* On mobile there's no room for a right-hand column, so the
                timestamp rides along on the meta line instead. */}
            {log.created_at && (
              <span className="sm:hidden">
                {" · "}
                {new Date(log.created_at).toLocaleString()}
              </span>
            )}
          </span>
        </span>

        <span className="hidden shrink-0 whitespace-nowrap text-xs text-slate-400 sm:block">
          {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
        </span>
      </button>

      {open && hasDetail && (
        <div className="space-y-3 bg-slate-50/70 px-4 pb-4 pt-1 sm:pl-11">
          {log.changes && (
            <ChangeTable changes={log.changes as Record<string, unknown>} />
          )}

          {log.context && Object.keys(log.context).length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Context
              </p>
              <ChangeTable changes={log.context} />
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
            {log.actor.email && <span>{log.actor.email}</span>}
            {log.ip_address && <span>IP {log.ip_address}</span>}
          </div>
        </div>
      )}
    </li>
  );
}

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<AuditFilters | null>(null);

  // Filters live in the URL so a refresh or a shared link reproduces the view.
  const { state, set, reset, isDirty } = useTableQueryState({
    q: "",
    action: "",
    subject_type: "",
    user_id: "",
    date_from: "",
    date_to: "",
    page: 1,
  });

  useEffect(() => {
    auditLogService
      .filters()
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, []);

  // Debounced so typing in search doesn't fire a request per keystroke.
  const query = useMemo(
    () => ({
      q: state.q,
      action: state.action,
      subject_type: state.subject_type,
      user_id: state.user_id,
      date_from: state.date_from,
      date_to: state.date_to,
      page: state.page,
      per_page: PER_PAGE,
    }),
    [state],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      auditLogService
        .list(query)
        .then((page) => {
          if (cancelled) return;
          setLogs(page.data);
          setTotal(page.meta.total);
          setLastPage(page.meta.last_page);
          setError(null);
        })
        .catch(() => !cancelled && setError("Could not load the audit log."))
        .finally(() => !cancelled && setLoading(false));
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        description="Every change made on the platform — who did what, when, and exactly which fields moved."
      />

      <Card className="min-w-0 overflow-hidden">
        <div className="space-y-2 border-b border-gray-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={state.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search description, subject, or actor…"
              className={`${inputCls} py-2 pl-9`}
            />
          </div>

          {/* Two-up grid on mobile keeps the controls aligned instead of
              wrapping to uneven widths; falls back to an inline row on sm+. */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              value={state.action}
              onChange={(e) => set({ action: e.target.value })}
              className={`${inputCls} w-full py-2 sm:w-auto`}
            >
              <option value="">All actions</option>
              {filterOptions?.actions.map((a) => (
                <option key={a} value={a} className="capitalize">
                  {prettyAction(a)}
                </option>
              ))}
            </select>

            <select
              value={state.subject_type}
              onChange={(e) => set({ subject_type: e.target.value })}
              className={`${inputCls} w-full py-2 sm:w-auto`}
            >
              <option value="">All records</option>
              {filterOptions?.subject_types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={state.user_id}
              onChange={(e) => set({ user_id: e.target.value })}
              className={`${inputCls} col-span-2 w-full py-2 sm:col-span-1 sm:w-auto`}
            >
              <option value="">Anyone</option>
              {filterOptions?.actors.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name ?? `User #${a.id}`}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={state.date_from}
              onChange={(e) => set({ date_from: e.target.value })}
              className={`${inputCls} w-full py-2 sm:w-auto`}
              aria-label="From date"
            />
            <input
              type="date"
              value={state.date_to}
              onChange={(e) => set({ date_to: e.target.value })}
              className={`${inputCls} w-full py-2 sm:w-auto`}
              aria-label="To date"
            />

            {isDirty && (
              <button
                type="button"
                onClick={reset}
                className="col-span-2 inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:col-span-1 sm:justify-start"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-5 text-center text-sm text-red-600">{error}</div>
        ) : loading ? (
          <div className="space-y-3 p-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonLine key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nothing recorded yet"
            description={
              isDirty
                ? "No entries match these filters."
                : "Admin actions and data changes will appear here as they happen."
            }
          />
        ) : (
          <ul>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </ul>
        )}

        {!loading && !error && logs.length > 0 && (
          <Pagination
            currentPage={state.page}
            totalPages={lastPage}
            totalItems={total}
            pageSize={PER_PAGE}
            onPageChange={(page) => set({ page })}
          />
        )}
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        This log is append-only — entries cannot be edited or deleted.
      </p>
    </div>
  );
};

export default AuditLogsPage;
