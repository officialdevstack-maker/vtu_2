import { useEffect, useState } from "react";
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
  SkeletonLine,
  Toggle,
  inputCls,
} from "../../../user/components/shared-ui";

type PermissionGroup = "Customers" | "Wallets" | "Transactions" | "Support" | "Settings";
type RoleStatus = "active" | "inactive";

type Role = {
  id: string;
  name: string;
  description: string;
  usersAssigned: number;
  permissions: PermissionGroup[];
  status: RoleStatus;
  isSystem: boolean;
};

const permissionGroups: PermissionGroup[] = ["Customers", "Wallets", "Transactions", "Support", "Settings"];

const initialRoles: Role[] = [
  {
    id: "ROLE001",
    name: "Super Admin",
    description: "Full access to every module, including system settings and role management.",
    usersAssigned: 2,
    permissions: ["Customers", "Wallets", "Transactions", "Support", "Settings"],
    status: "active",
    isSystem: true,
  },
  {
    id: "ROLE002",
    name: "Admin",
    description: "Manage customers, transactions, and support tickets across the platform.",
    usersAssigned: 5,
    permissions: ["Customers", "Wallets", "Transactions", "Support"],
    status: "active",
    isSystem: true,
  },
  {
    id: "ROLE003",
    name: "Support Staff",
    description: "Handle customer support tickets and view transaction history for context.",
    usersAssigned: 8,
    permissions: ["Customers", "Support"],
    status: "active",
    isSystem: true,
  },
  {
    id: "ROLE004",
    name: "Finance Officer",
    description: "Approve wallet funding requests and reconcile provider transactions.",
    usersAssigned: 3,
    permissions: ["Wallets", "Transactions"],
    status: "active",
    isSystem: true,
  },
  {
    id: "ROLE005",
    name: "Compliance Reviewer",
    description: "Review KYC submissions and flag suspicious customer accounts.",
    usersAssigned: 1,
    permissions: ["Customers"],
    status: "inactive",
    isSystem: false,
  },
];

const emptyForm = { name: "", description: "", permissions: [] as PermissionGroup[], status: true };

type ModalMode = "create" | "edit" | "view" | null;

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const totalRoles = roles.length;
  const adminUsers = roles
    .filter((r) => r.name === "Super Admin" || r.name === "Admin")
    .reduce((sum, r) => sum + r.usersAssigned, 0);
  const supportStaff = roles.find((r) => r.name === "Support Staff")?.usersAssigned ?? 0;
  const customRoles = roles.filter((r) => !r.isSystem).length;

  const togglePermission = (p: PermissionGroup) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setActiveRole(null);
    setModalMode("create");
  };

  const openView = (r: Role) => {
    setActiveRole(r);
    setModalMode("view");
    setOpenMenuId(null);
  };

  const openEdit = (r: Role) => {
    setActiveRole(r);
    setForm({ name: r.name, description: r.description, permissions: r.permissions, status: r.status === "active" });
    setModalMode("edit");
    setOpenMenuId(null);
  };

  const duplicateRole = (r: Role) => {
    const copy: Role = {
      ...r,
      id: `ROLE${Math.floor(Math.random() * 90000 + 10000)}`,
      name: `${r.name} (copy)`,
      usersAssigned: 0,
      isSystem: false,
    };
    setRoles((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveRole(null);
  };

  const saveRole = () => {
    if (!form.name.trim()) return;
    if (modalMode === "edit" && activeRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === activeRole.id
            ? { ...r, name: form.name, description: form.description, permissions: form.permissions, status: form.status ? "active" : "inactive" }
            : r,
        ),
      );
    } else {
      const newRole: Role = {
        id: `ROLE${Math.floor(Math.random() * 90000 + 10000)}`,
        name: form.name,
        description: form.description,
        usersAssigned: 0,
        permissions: form.permissions,
        status: form.status ? "active" : "inactive",
        isSystem: false,
      };
      setRoles((prev) => [...prev, newRole]);
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & permissions"
        description="Define what each team member can see and do across the admin console"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create role
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <StatCard label="Total roles" value={String(totalRoles)} icon={ShieldCheck} tone="neutral" meta="Across the platform" />
            <StatCard label="Admin users" value={String(adminUsers)} icon={UserCog} tone="neutral" meta="Super admin + admin" />
            <StatCard label="Support staff" value={String(supportStaff)} icon={Headset} tone="success" meta="Assigned support role" />
            <StatCard label="Custom roles" value={String(customRoles)} icon={Users} tone="warning" meta="Non-default roles" />
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">All roles</h3>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No roles yet"
            description="Create a role to start assigning permissions to your team"
            action={<Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" /> Create role</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[880px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Role name", "Description", "Users assigned", "Permissions", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2 text-xs font-medium text-slate-500 whitespace-nowrap ${
                        h === "Users assigned" ? "text-right" : h === "Actions" ? "text-center" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-xs whitespace-nowrap">{r.name}</span>
                        {r.isSystem && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[240px]">{r.description}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums whitespace-nowrap">{r.usersAssigned}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {r.permissions.map((p) => (
                          <span key={p} className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === r.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
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
                                onClick={() => { setDeleteTarget(r); setOpenMenuId(null); }}
                                title={r.isSystem ? "System roles cannot be deleted" : undefined}
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
        )}
      </Card>

      {/* Create / Edit / View modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-900 text-sm">
                {modalMode === "create" ? "Create role" : modalMode === "edit" ? "Edit role" : "Role details"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === "view" && activeRole ? (
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Role name</p>
                  <p className="text-sm font-medium text-slate-900">{activeRole.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{activeRole.description}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRole.permissions.length === 0 && <p className="text-xs text-slate-400">No permissions assigned</p>}
                    {activeRole.permissions.map((p) => (
                      <span key={p} className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                        {p}
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
                  <p className="text-sm font-medium text-slate-900">{activeRole.usersAssigned}</p>
                </div>
                <Button fullWidth onClick={closeModal}>Close</Button>
              </div>
            ) : (
              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Role name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Fraud Analyst"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What this role is responsible for"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Permission groups</label>
                  <div className="space-y-1 border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {permissionGroups.map((p) => (
                      <div key={p} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-slate-700">{p}</span>
                        <Toggle value={form.permissions.includes(p)} onChange={() => togglePermission(p)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                  <span className="text-sm text-slate-700">Active</span>
                  <Toggle value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
                  <Button fullWidth disabled={!form.name.trim()} onClick={saveRole}>
                    {modalMode === "edit" ? "Save changes" : "Create role"}
                  </Button>
                </div>
              </div>
            )}
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
                Deleting "{deleteTarget.name}" removes it permanently. Users on this role should be reassigned first.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={confirmDelete}>Delete role</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
