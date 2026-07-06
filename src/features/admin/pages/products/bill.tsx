import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ReceiptText,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
  inputCls,
  Pagination,
} from "../../../user/components/shared-ui";
import { usePagination } from "@shared/pagination";
import { Toolbar } from "./airtime-data/shared";
import { billPlanService, type BillPlan } from "./bill-service";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

const MENU_WIDTH = 144; // w-36

type SortKey = "id" | "disco" | "min" | "max" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const SORT_COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "id", label: "ID", align: "left" },
  { key: "disco", label: "Disco", align: "left" },
  { key: "min", label: "Min (₦)" },
  { key: "max", label: "Max (₦)" },
  { key: "status", label: "Status" },
];

function sortValue(plan: BillPlan, key: SortKey): string | number {
  switch (key) {
    case "id":
      return Number(plan.id);
    case "disco":
      return (plan.disco ?? "").toLowerCase();
    case "min":
      return Number(plan.min ?? 0);
    case "max":
      return Number(plan.max ?? 0);
    case "status":
      return plan.active ? 1 : 0;
  }
}

export default function BillPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BillPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "disco", direction: "asc" });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // The table scrolls horizontally (overflow-x-auto), which forces
  // overflow-y to auto too per the CSS spec — an `absolute` dropdown would
  // get clipped by that. Fixed-positioning it from the trigger's own
  // bounding rect escapes the table's overflow context entirely.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const toId = (value: string | number) => String(value);

  const load = () => {
    setLoading(true);
    billPlanService
      .getAll()
      .then(setPlans)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const handleDelete = async (plan: BillPlan) => {
    setDeletingId(toId(plan.id));
    setOpenMenuId(null);
    try {
      await billPlanService.remove(toId(plan.id));
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = plans.filter((p) => !q || p.disco?.toLowerCase().includes(q));

    const sorted = [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (av < bv) return sort.direction === "asc" ? -1 : 1;
      if (av > bv) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [plans, search, sort]);

  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    pageItems,
    setPage,
  } = usePagination(filtered);

  // Jump back to page 1 whenever the result set changes shape (new search
  // or sort) so the user isn't stranded on a now-empty page.
  useEffect(() => {
    setPage(1);
  }, [search, sort, setPage]);

  // "Select all" only ever acts on the current page — selection itself
  // persists across page changes so a multi-page bulk action still works.
  const pageIds = useMemo(() => pageItems.map((p) => toId(p.id)), [pageItems]);
  const selectedCount = selectedIds.size;
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

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

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkSetActive = async (active: boolean) => {
    setBulkBusy(true);
    try {
      await billPlanService.bulkSetActive(Array.from(selectedIds), active);
      setPlans((prev) =>
        prev.map((p) => (selectedIds.has(toId(p.id)) ? { ...p, active } : p)),
      );
      setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} selected bill plan(s)? This cannot be undone.`)) {
      return;
    }
    setBulkBusy(true);
    try {
      await billPlanService.bulkRemove(Array.from(selectedIds));
      setPlans((prev) => prev.filter((p) => !selectedIds.has(toId(p.id))));
      setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bill"
        description="Electricity discos and bill plans — a per-disco amount range plus a per-role service fee, not a fixed catalog price."
      />

      <Card className="overflow-visible">
        <Toolbar>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discos…"
              className={`${inputCls} pl-9 py-2`}
            />
          </div>
          <div className="flex-1" />
          <Button size="sm" onClick={() => navigate("/admin/products/bill/new")}>
            <Plus className="w-3.5 h-3.5" />
            Add bill plan
          </Button>
        </Toolbar>

        {selectedCount > 0 && (
          <div className="px-4 py-2.5 border-b border-gray-100 bg-slate-50 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-slate-600">
              {selectedCount} selected
            </span>
            <div className="flex-1" />
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
            icon={ReceiptText}
            title={search ? "No bill plans match your search" : "No bill plans added"}
            description={
              search
                ? "Try a different search."
                : "Add a disco with its amount range and service fee to make it available for purchase."
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
                        {plan.disco}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-right">
                        {formatCurrency(plan.min)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-right">
                        {formatCurrency(plan.max)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-right">
                        <StatusBadge status={plan.active ? "active" : "inactive"} />
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
                                    navigate(`/admin/products/bill/${toId(plan.id)}/edit`, {
                                      state: { billPlan: plan },
                                    });
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
    </div>
  );
}
