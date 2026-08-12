import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  X,
  XCircle,
  BadgePercent,
} from "lucide-react";
import {
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
  inputCls,
  Pagination,
} from "../../../../user/components/shared-ui";
import { DEFAULT_PAGE_SIZE, usePagination } from "@shared/pagination";
import { useTableQueryState } from "@shared/table-query-state";
import { Toolbar, SelectFilter } from "./shared";
import {
  dataPlanService,
  roleService,
  type DataPlan,
  type Role,
} from "./service";
import { clearCatalogRequestCache } from "@/shared/api/catalogCache";

const MENU_WIDTH = 144; // w-36
const EMPTY_DATA_PLANS: DataPlan[] = [];
type BulkRolePrice = {
  enabled: boolean;
  mode: "percentage" | "fiat";
  value: string;
};

const roleLabel = (role: Role): string =>
  (role.name || role.slug || "Role")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function BulkPricingModal({
  count,
  roles,
  saving,
  onClose,
  onApply,
}: {
  count: number;
  roles: Role[];
  saving: boolean;
  onClose: () => void;
  onApply: (
    updates: Record<string, { mode: "percentage" | "fiat"; value: number }>,
  ) => void;
}) {
  const [values, setValues] = useState<Record<string, BulkRolePrice>>(() =>
    Object.fromEntries(
      roles.map((role) => [
        role.name,
        { enabled: false, mode: "percentage", value: "" },
      ]),
    ),
  );
  const updates = Object.fromEntries(
    Object.entries(values)
      .filter(([, entry]) => entry.enabled && entry.value !== "")
      .map(([role, entry]) => [
        role,
        { mode: entry.mode, value: Number(entry.value) },
      ]),
  );
  const invalid = Object.values(updates).some(
    (entry) => !Number.isFinite(entry.value) || entry.value < 0,
  );
  const summary = Object.entries(updates).map(
    ([role, entry]) =>
      `${role} → +${entry.mode === "percentage" ? `${entry.value}%` : `₦${entry.value.toLocaleString()}`}`,
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Update role pricing</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Only checked roles will be updated. Unchecked roles will keep
              their current pricing.
            </p>
            <p className="text-xs text-slate-400">
              Applying to {count} selected plans.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[55vh] divide-y divide-slate-100 overflow-y-auto px-5">
          {roles.map((role) => {
            const entry = values[role.name] ?? { enabled: false, mode: "percentage" as const, value: "" };
            return (
              <div
                key={role.id}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 py-3 sm:grid-cols-[minmax(9rem,1fr)_auto] sm:items-center"
              >
                <label
                  htmlFor={`bulk-role-${role.id}`}
                  className="block min-w-0 text-sm font-semibold text-slate-800"
                >
                  {roleLabel(role)}
                </label>
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <input
                    id={`bulk-role-${role.id}`}
                    type="checkbox"
                    checked={entry.enabled}
                    aria-label={`Update ${roleLabel(role)} pricing`}
                    onChange={(event) => setValues((current) => ({ ...current, [role.name]: { ...entry, enabled: event.target.checked } }))}
                    className="h-4 w-4 shrink-0 accent-slate-900"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!entry.enabled}
                    value={entry.value}
                    aria-label={`${roleLabel(role)} markup value`}
                    onChange={(event) => setValues((current) => ({ ...current, [role.name]: { ...entry, value: event.target.value } }))}
                    className={`${inputCls} min-w-0 flex-1 py-1.5 sm:w-24 sm:flex-none disabled:bg-slate-50`}
                  />
                  <select
                    disabled={!entry.enabled}
                    value={entry.mode}
                    aria-label={`${roleLabel(role)} pricing mode`}
                    onChange={(event) => setValues((current) => ({ ...current, [role.name]: { ...entry, mode: event.target.value as "percentage" | "fiat" } }))}
                    className="h-9 w-16 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-xs disabled:bg-slate-50"
                  >
                    <option value="percentage">%</option>
                    <option value="fiat">₦</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
        {summary.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600">
            <p className="mb-1 font-medium">Apply role pricing to {count} selected data plans?</p>
            <p>{summary.join(" · ")}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button variant="secondary" size="sm" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} disabled={saving || invalid || summary.length === 0} onClick={() => onApply(updates)}>
            Apply to {count} plans
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Pull the useful bits out of an axios-style error so a failed bulk action
// tells the admin *why* (HTTP status + server message) instead of a generic
// "couldn't do it". A network timeout has no response, so say so explicitly.
function describeError(err: unknown): string {
  const e = err as {
    response?: { status?: number; data?: { message?: string } };
    code?: string;
    message?: string;
  };
  if (e?.response) {
    const status = e.response.status;
    const serverMsg = e.response.data?.message;
    return serverMsg ? `HTTP ${status}: ${serverMsg}` : `HTTP ${status}`;
  }
  if (e?.code === "ECONNABORTED") return "the request timed out";
  return e?.message || "unknown error";
}

type SortKey = "id" | "plan" | "network" | "plan_type" | "price" | "validity" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const SORT_COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "id", label: "ID", align: "left" },
  { key: "plan", label: "Plan", align: "left" },
  { key: "network", label: "Network" },
  { key: "plan_type", label: "Type" },
  { key: "price", label: "Price" },
  { key: "validity", label: "Validity" },
  { key: "status", label: "Status" },
];

// Matches the formatter already used for Airtime's Min|Max (₦) column
// (airtime-tab.tsx) so currency renders consistently across both tabs.
const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

function sortValue(plan: DataPlan, key: SortKey): string | number {
  switch (key) {
    case "id":
      return Number(plan.id);
    case "plan":
      return (plan.plan ?? `${plan.plan_name}${plan.plan_size}`).toLowerCase();
    case "network":
      return (plan.network ?? "").toLowerCase();
    case "plan_type":
      return (plan.plan_type ?? "").toLowerCase();
    case "price":
      return plan.price === null || plan.price === undefined || plan.price === ""
        ? -1
        : Number(plan.price);
    case "validity":
      return (plan.validity ?? "").toLowerCase();
    case "status":
      return plan.active ? 1 : 0;
  }
}

export function DataPlansTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const plansQuery = useQuery({
    queryKey: ["admin", "data-plans", "list"],
    queryFn: dataPlanService.getAll,
    staleTime: 5 * 60_000,
  });
  const plans = plansQuery.data ?? EMPTY_DATA_PLANS;
  const loading = plansQuery.isPending;
  const setPlans = (
    updater: (current: DataPlan[]) => DataPlan[],
  ) => queryClient.setQueryData<DataPlan[]>(
    ["admin", "data-plans", "list"],
    (current) => updater(current ?? []),
  );

  // Search/filter/sort/page live in the URL, so a refresh, the browser back
  // button, or a shared link all reproduce the same view instead of dropping
  // you back on an unfiltered page 1.
  const { state, set, reset, isDirty } = useTableQueryState({
    q: "",
    network: "",
    type: "",
    status: "",
    sort: "network",
    dir: "asc",
    page: 1,
  });

  const search = state.q;
  const networkFilter = state.network;
  const typeFilter = state.type;
  const statusFilter = state.status;
  const sort: SortState = useMemo(
    () => ({
      key: state.sort as SortKey,
      direction: state.dir === "desc" ? "desc" : "asc",
    }),
    [state.sort, state.dir],
  );

  const setSearch = (value: string) => set({ q: value });
  const setNetworkFilter = (value: string) => set({ network: value });
  const setTypeFilter = (value: string) => set({ type: value });
  const setStatusFilter = (value: string) => set({ status: value });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // The table scrolls horizontally (overflow-x-auto), which forces
  // overflow-y to auto too per the CSS spec — an `absolute` dropdown would
  // get clipped by that. Fixed-positioning it from the trigger's own
  // bounding rect escapes the table's overflow context entirely.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkPricingOpen, setBulkPricingOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const toId = (value: string | number) => String(value);

  const load = () => {
    void plansQuery.refetch();
  };

  useEffect(() => {
    roleService.getAll().then(setRoles).catch(() => setRoles([]));
  }, []);

  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    setOpenMenuId(id);
  };

  const toggleSort = (key: SortKey) => {
    set(
      sort.key === key
        ? { sort: key, dir: sort.direction === "asc" ? "desc" : "asc" }
        : { sort: key, dir: "asc" },
    );
  };

  const handleDelete = async (plan: DataPlan) => {
    setDeletingId(toId(plan.id));
    setOpenMenuId(null);
    try {
      await dataPlanService.remove(toId(plan.id));
      setPlans((prev) => prev.filter((p) => toId(p.id) !== toId(plan.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(toId(plan.id));
        return next;
      });
    } finally {
      setDeletingId(null);
    }
  };

  const networkOptions = useMemo(
    () =>
      Array.from(new Set(plans.map((p) => p.network).filter(Boolean))).map(
        (network) => ({ value: network.toLowerCase(), label: network }),
      ),
    [plans],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(plans.map((p) => p.plan_type).filter(Boolean))).map(
        (type) => ({ value: type.toLowerCase(), label: type }),
      ),
    [plans],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = plans.filter((p) => {
      const matchesSearch =
        !q ||
        p.plan_name?.toLowerCase().includes(q) ||
        p.plan?.toLowerCase().includes(q) ||
        p.network?.toLowerCase().includes(q);
      const matchesNetwork = !networkFilter || p.network?.toLowerCase() === networkFilter;
      const matchesType = !typeFilter || p.plan_type?.toLowerCase() === typeFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "draft" ? Boolean(p.is_draft) : statusFilter === "active" ? p.active && !p.is_draft : !p.active && !p.is_draft);
      return matchesSearch && matchesNetwork && matchesType && matchesStatus;
    });

    const sorted = [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (av < bv) return sort.direction === "asc" ? -1 : 1;
      if (av > bv) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [plans, search, networkFilter, typeFilter, statusFilter, sort]);

  // Controlled by the URL. useTableQueryState already sends the user back to
  // page 1 whenever a filter or the sort changes, so no reset effect is needed.
  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    pageItems,
    setPage,
  } = usePagination(filtered, DEFAULT_PAGE_SIZE, state.page, (page) =>
    set({ page }),
  );

  // The header checkbox only ever acts on the current page — selection
  // itself persists across page changes. "Select all N matching plans"
  // below extends a page selection to every row the current filters match,
  // across all pages, without paging through them one at a time.
  const pageIds = useMemo(() => pageItems.map((p) => toId(p.id)), [pageItems]);
  const filteredIds = useMemo(() => filtered.map((p) => toId(p.id)), [filtered]);
  const selectedCount = selectedIds.size;
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...pageIds]);
    });
  };

  const selectAllFiltered = () => setSelectedIds(new Set(filteredIds));

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkSetActive = async (active: boolean) => {
    const ids = Array.from(selectedIds);
    setBulkBusy(true);
    try {
      await dataPlanService.bulkSetActive(ids, active);
      const idSet = new Set(ids);
      setPlans((prev) =>
        prev.map((p) => (idSet.has(toId(p.id)) ? { ...p, active } : p)),
      );
      setSelectedIds(new Set());
    } catch (err) {
      // A chunk may have partially succeeded before failing, so pull the
      // real server state back instead of leaving the UI guessing.
      window.alert(
        `Could not ${active ? "activate" : "deactivate"} all ${ids.length} selected plan(s) — ${describeError(err)}.\n\nSome may have been updated; the list has been refreshed. Please retry.`,
      );
      console.error("Bulk set active failed", err);
      load();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!window.confirm(`Delete ${ids.length} selected data plan(s)? This cannot be undone.`)) {
      return;
    }
    setBulkBusy(true);
    try {
      await dataPlanService.bulkRemove(ids);
      const idSet = new Set(ids);
      setPlans((prev) => prev.filter((p) => !idSet.has(toId(p.id))));
      setSelectedIds(new Set());
    } catch (err) {
      window.alert(
        `Could not delete all ${ids.length} selected plan(s) — ${describeError(err)}.\n\nSome may have been deleted; the list has been refreshed. Please retry.`,
      );
      console.error("Bulk delete failed", err);
      load();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkPricing = async (
    updates: Record<string, { mode: "percentage" | "fiat"; value: number }>,
  ) => {
    setBulkBusy(true);
    try {
      const result = await dataPlanService.bulkUpdatePricing(
        Array.from(selectedIds),
        updates,
      );
      clearCatalogRequestCache();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "data-plans", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["data-plans"] }),
      ]);
      setBulkPricingOpen(false);
      setSelectedIds(new Set());
      window.alert(`Updated role pricing for ${result.updated} plans.`);
    } catch (err) {
      window.alert(`Could not update role pricing — ${describeError(err)}.`);
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <Toolbar>
        <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans…"
            className={`${inputCls} pl-9 py-2`}
          />
        </div>
        <SelectFilter
          placeholder="All networks"
          options={networkOptions}
          value={networkFilter}
          onChange={setNetworkFilter}
        />
        <SelectFilter
          placeholder="All types"
          options={typeOptions}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <SelectFilter
          placeholder="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "draft", label: "Draft" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        {isDirty && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => navigate("/admin/products/airtime-data/data-plans/new")}
        >
          <Plus className="w-3.5 h-3.5" />
          Add plan
        </Button>
      </Toolbar>

      {selectedCount > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-100 bg-slate-50 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-slate-600">
            {selectedCount} selected
          </span>
          {allPageSelected && !allFilteredSelected && filteredIds.length > pageIds.length && (
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-xs font-medium text-[#111827] underline underline-offset-2 hover:no-underline"
            >
              Select all {filteredIds.length} matching plans
            </button>
          )}
          {allFilteredSelected && filteredIds.length > pageIds.length && (
            <span className="text-xs text-slate-500">
              All {filteredIds.length} matching plans selected.
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            disabled={bulkBusy || roles.length === 0}
            onClick={() => setBulkPricingOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50"
          >
            <BadgePercent className="h-3.5 w-3.5" /> Update role pricing
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulkSetActive(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Activate
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulkSetActive(false)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" /> Deactivate
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulkDelete()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}

      {bulkPricingOpen && (
        <BulkPricingModal
          count={selectedCount}
          roles={roles}
          saving={bulkBusy}
          onClose={() => setBulkPricingOpen(false)}
          onApply={(updates) => void handleBulkPricing(updates)}
        />
      )}

      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine className="h-7 w-7 rounded-full" />
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-3 flex-1" />
              <SkeletonLine className="h-5 w-14 rounded-md" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Database}
          title={
            search || networkFilter || typeFilter || statusFilter
              ? "No data plans match your filters"
              : "No data plans added"
          }
          description={
            search || networkFilter || typeFilter || statusFilter
              ? "Try a different search or filter."
              : "Add data plan bundles per network and type to make them available for purchase."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2.5 w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#111827]"
                  />
                </th>
                {SORT_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap select-none ${col.align === "left" ? "text-left" : "text-right"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-slate-700 transition-colors ${col.align === "left" ? "" : "flex-row-reverse"}`}
                    >
                      {col.label}
                      {sort.key === col.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageItems.map((plan) => {
                const currentId = toId(plan.id);
                const isSelected = selectedIds.has(currentId);

                return (
                  <tr
                    key={plan.id}
                    className={`transition-colors ${isSelected ? "bg-slate-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(currentId)}
                        className="w-3.5 h-3.5 rounded border-gray-300 accent-[#111827]"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {plan.id}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {plan.plan ?? `${plan.plan_name}${plan.plan_size}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right capitalize">
                      {plan.network}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {plan.plan_type}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900 text-right">
                      {plan.price_ngn ?? formatCurrency(plan.price)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {plan.validity}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      <StatusBadge
                        status={plan.is_draft ? "draft" : plan.active ? "active" : "inactive"}
                      />
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="relative inline-flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(currentId, e);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === currentId && menuPos && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              className="fixed z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/products/airtime-data/data-plans/${toId(plan.id)}/edit`,
                                    { state: { dataPlan: plan } },
                                  );
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                disabled={deletingId === currentId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDelete(plan);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          label="plans"
        />
      )}
    </Card>
  );
}
