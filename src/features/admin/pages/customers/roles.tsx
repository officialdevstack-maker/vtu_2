import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  MoreVertical,
  ShieldCheck,
  Users,
  UserCog,
  Headset,
  X,
  AlertTriangle,
} from "lucide-react";
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
} from "../../../user/components/shared-ui";
import { usePagination } from "../../../../shared/pagination";
import { roleService, type Role } from "./service";

export default function RolesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    currentPage,
    pageItems: paginatedRoles,
    pageSize,
    setPage,
    totalItems,
    totalPages,
  } = usePagination(roles);

  const loadRoles = async () => {
    try {
      const data = await roleService.getAll();
      setRoles(data);
      setError(null);
    } catch (e) {
      setError(
        "Could not load roles from the API. Please try refreshing the page.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const totalRoles = roles.length;
  const adminUsers = roles
    .filter((r) => r.slug.includes("admin"))
    .reduce((sum, r) => sum + r.usersAssigned, 0);
  const supportStaff = roles
    .filter((r) => r.slug.includes("support"))
    .reduce((sum, r) => sum + r.usersAssigned, 0);
  const customRoles = roles.filter((r) => !r.isSystem).length;

  const openCreate = () => navigate("/admin/customers/roles/new");

  const openView = (r: Role) => {
    setActiveRole(r);
    setOpenMenuId(null);
  };

  const openEdit = (r: Role) => {
    setOpenMenuId(null);
    navigate(`/admin/customers/roles/${r.id}/edit`, { state: { role: r } });
  };

  const duplicateRole = async (r: Role) => {
    setOpenMenuId(null);
    setError(null);
    try {
      const created = await roleService.create({
        name: `${r.name} (copy)`,
        description: r.description,
        status: r.status,
        permissionIds: r.permissions.map((p) => p.id),
        upgradable: r.upgradable,
        upgradeCost: r.upgradeCost,
      });
      setRoles((prev) => {
        const idx = prev.findIndex((x) => x.id === r.id);
        const next = [...prev];
        next.splice(idx + 1, 0, created);
        return next;
      });
    } catch {
      setError("The role could not be duplicated right now.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roleService.remove(deleteTarget.id);
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch {
      setError("The role could not be deleted right now.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & permissions"
        description="Define what each team member can see and do across the admin console"
        actions={
          <Button onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="w-4 h-4" /> Create role
          </Button>
        }
      />
      <Button onClick={openCreate} fullWidth className="sm:hidden">
        <Plus className="w-4 h-4" /> Create role
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
              label="Total roles"
              value={String(totalRoles)}
              icon={ShieldCheck}
              tone="neutral"
              meta="Across the platform"
            />
            <StatCard
              label="Admin users"
              value={String(adminUsers)}
              icon={UserCog}
              tone="neutral"
              meta="Super admin + admin"
            />
            <StatCard
              label="Support staff"
              value={String(supportStaff)}
              icon={Headset}
              tone="success"
              meta="Assigned support role"
            />
            <StatCard
              label="Custom roles"
              value={String(customRoles)}
              icon={Users}
              tone="warning"
              meta="Non-default roles"
            />
          </>
        )}
      </div>

      <Card className="overflow-visible">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">All roles</h3>
        </div>

        {loading ? (
          <SkeletonRows count={4} withAvatar={false} />
        ) : roles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No roles yet"
            description="Create a role to start assigning permissions to your team"
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-3.5 h-3.5" /> Create role
              </Button>
            }
          />        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {paginatedRoles.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openView(r)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {r.name}
                        </p>
                        {r.isSystem && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            System
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {r.description}
                      </p>
                    </button>

                    <div className="relative shrink-0">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === r.id ? null : r.id)
                        }
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-gray-100"
                        title="Actions"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      {openMenuId === r.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200/70 bg-white py-1 shadow-md">
                            <button
                              onClick={() => openView(r)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              onClick={() => openEdit(r)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => duplicateRole(r)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                            >
                              <Copy className="h-3.5 w-3.5" /> Duplicate
                            </button>
                            <button
                              disabled={r.isSystem}
                              onClick={() => {
                                setDeleteTarget(r);
                                setOpenMenuId(null);
                              }}
                              title={
                                r.isSystem
                                  ? "System roles cannot be deleted"
                                  : undefined
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {r.usersAssigned} user{r.usersAssigned === 1 ? "" : "s"}
                    </span>
                  </div>

                  {r.permissions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {r.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full border border-[#111827]/15 bg-[#111827]/10 px-2 py-0.5 text-[10px] font-medium text-[#111827]"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm table-fixed min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-[26%] lg:w-[14%] px-4 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap">
                      Role name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap">
                      Description
                    </th>
                    <th className="hidden lg:table-cell lg:w-[12%] px-4 py-2 text-right text-xs font-medium text-slate-500 whitespace-nowrap">
                      Users assigned
                    </th>
                    <th className="hidden lg:table-cell lg:w-[22%] px-4 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap">
                      Permissions
                    </th>
                    <th className="w-[20%] lg:w-[10%] px-4 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap">
                      Status
                    </th>
                    <th className="w-14 px-2 py-2 text-center text-xs font-medium text-slate-500 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRoles.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors align-top"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900 text-xs">
                            {r.name}
                          </span>
                          {r.isSystem && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                              System
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {r.description}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-right text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {r.usersAssigned}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.permissions.map((p) => (
                            <span
                              key={p.id}
                              className="text-[10px] font-medium text-[#111827] bg-[#111827]/10 border border-[#111827]/15 rounded-full px-2 py-0.5 whitespace-nowrap"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-2 py-3">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === r.id ? null : r.id)
                            }
                            className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openMenuId === r.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200/70 rounded-xl shadow-md py-1">
                                <button
                                  onClick={() => openView(r)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  onClick={() => openEdit(r)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => duplicateRole(r)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Duplicate
                                </button>
                                <button
                                  disabled={r.isSystem}
                                  onClick={() => {
                                    setDeleteTarget(r);
                                    setOpenMenuId(null);
                                  }}
                                  title={
                                    r.isSystem
                                      ? "System roles cannot be deleted"
                                      : undefined
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
              onPageChange={setPage}
              label="records"
            />
          </>
        )}
      </Card>

      {/* View modal */}
      {activeRole && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-900 text-sm">
                Role details
              </h3>
              <button
                onClick={() => setActiveRole(null)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Role name</p>
                <p className="text-sm font-medium text-slate-900">
                  {activeRole.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700">
                  {activeRole.description}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeRole.permissions.length === 0 && (
                    <p className="text-xs text-slate-400">
                      No permissions assigned
                    </p>
                  )}
                  {activeRole.permissions.map((p) => (
                    <span
                      key={p.id}
                      className="text-xs font-medium text-[#111827] bg-[#111827]/10 border border-[#111827]/15 rounded-full px-2 py-0.5"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Status</p>
                <StatusBadge status={activeRole.status} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Users assigned</p>
                <p className="text-sm font-medium text-slate-900">
                  {activeRole.usersAssigned}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Account upgrade</p>
                <p className="text-sm font-medium text-slate-900">
                  {activeRole.upgradable
                    ? `Upgradable — ₦${(activeRole.upgradeCost ?? 0).toLocaleString()}`
                    : "Not upgradable"}
                </p>
              </div>
              <Button fullWidth onClick={() => setActiveRole(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
            <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                Deleting "{deleteTarget.name}" removes it permanently. Users on
                this role should be reassigned first.
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
              <Button
                variant="danger"
                fullWidth
                loading={deleting}
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? "" : "Delete role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
