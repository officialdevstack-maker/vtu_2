import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
  Radio,
  Zap,
  ToggleRight,
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
import {
  templateService,
  type Template,
  type TemplateType,
  type TemplateEvent,
  type TemplateChannel,
} from "./service";

const eventOptions: TemplateEvent[] = ["login", "register", "purchase", "wallet_credit", "wallet_debit"];
const channelOptions: TemplateChannel[] = ["email", "sms", "in_app", "push"];

const eventLabels: Record<TemplateEvent, string> = {
  login: "Login",
  register: "Register (welcome message)",
  purchase: "Purchase",
  wallet_credit: "Wallet credit",
  wallet_debit: "Wallet debit",
};

const channelLabels: Record<TemplateChannel, string> = {
  email: "Email",
  sms: "SMS",
  in_app: "In-app",
  push: "Push",
};

type FormState = {
  name: string;
  type: TemplateType;
  event: TemplateEvent | "";
  subject: string;
  content: string;
  channels: TemplateChannel[];
  enabled: boolean;
};

const emptyForm: FormState = {
  name: "",
  type: "broadcast",
  event: "",
  subject: "",
  content: "",
  channels: ["in_app"],
  enabled: true,
};

const toForm = (t: Template): FormState => ({
  name: t.name,
  type: t.type,
  event: t.event ?? "",
  subject: t.subject ?? "",
  content: t.content,
  channels: t.channels ?? [],
  enabled: t.enabled,
});

const extractVariables = (content: string): string[] => {
  const matches = content.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
};

type ModalMode = "create" | "edit" | "view" | null;

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [typeFilter, setTypeFilter] = useState<"all" | TemplateType>("all");
  const [eventFilter, setEventFilter] = useState<"all" | TemplateEvent>("all");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const loadTemplates = () => {
    setLoading(true);
    templateService
      .getAll({
        type: typeFilter === "all" ? undefined : typeFilter,
        event: eventFilter === "all" ? undefined : eventFilter,
        enabled: enabledFilter === "all" ? undefined : enabledFilter === "enabled",
      })
      .then((data) => {
        setTemplates(data);
        setError(null);
      })
      .catch(() => setError("Could not load templates from the API."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, eventFilter, enabledFilter]);

  const totalTemplates = templates.length;
  const eventTemplates = templates.filter((t) => t.type === "event").length;
  const broadcastTemplates = templates.filter((t) => t.type === "broadcast").length;
  const enabledTemplates = templates.filter((t) => t.enabled).length;

  const formVariables = useMemo(() => extractVariables(form.content), [form.content]);

  const toggleChannel = (c: TemplateChannel) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c],
    }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setActiveTemplate(null);
    setModalMode("create");
  };

  const openView = (t: Template) => {
    setActiveTemplate(t);
    setModalMode("view");
    setOpenMenuId(null);
  };

  const openEdit = (t: Template) => {
    setActiveTemplate(t);
    setForm(toForm(t));
    setModalMode("edit");
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveTemplate(null);
  };

  const saveTemplate = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        event: form.type === "event" ? (form.event || undefined) : null,
        subject: form.subject || null,
        content: form.content,
        channels: form.channels,
        enabled: form.enabled,
      };
      if (modalMode === "edit" && activeTemplate) {
        await templateService.update(activeTemplate.id, payload);
      } else {
        await templateService.create(payload);
      }
      closeModal();
      loadTemplates();
    } catch {
      setError("The template could not be saved right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await templateService.remove(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    } catch {
      setError("The template could not be deleted right now.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const valid = form.name.trim().length > 0 && form.content.trim().length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        description="Reusable, variable-driven messages used for lifecycle events and broadcasts"
        actions={
          <Button onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="w-4 h-4" /> Create template
          </Button>
        }
      />
      <Button onClick={openCreate} fullWidth className="sm:hidden">
        <Plus className="w-4 h-4" /> Create template
      </Button>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </div>
      )}

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
            <StatCard label="Total templates" value={String(totalTemplates)} icon={FileText} tone="neutral" meta="Across the platform" />
            <StatCard label="Event templates" value={String(eventTemplates)} icon={Zap} tone="neutral" meta="Tied to a lifecycle event" />
            <StatCard label="Broadcast templates" value={String(broadcastTemplates)} icon={Radio} tone="neutral" meta="Reusable one-off messages" />
            <StatCard label="Enabled" value={String(enabledTemplates)} icon={ToggleRight} tone="success" meta="Currently active" />
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-900">All templates</h3>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className={`${inputCls} py-2 text-sm w-full sm:w-40`}
            >
              <option value="all">All types</option>
              <option value="event">Event</option>
              <option value="broadcast">Broadcast</option>
            </select>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as typeof eventFilter)}
              className={`${inputCls} py-2 text-sm w-full sm:w-48`}
            >
              <option value="all">All events</option>
              {eventOptions.map((ev) => (
                <option key={ev} value={ev}>{eventLabels[ev]}</option>
              ))}
            </select>
            <select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value as typeof enabledFilter)}
              className={`${inputCls} py-2 text-sm w-full sm:w-40`}
            >
              <option value="all">All statuses</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
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
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create a template for an event like registration, or a reusable broadcast"
            action={<Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" /> Create template</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name", "Type", "Event", "Channels", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2 text-xs font-medium text-slate-500 whitespace-nowrap ${
                        h === "Actions" ? "text-center" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 text-xs whitespace-nowrap">{t.name}</span>
                      {t.subject && <p className="text-xs text-slate-400 mt-0.5 max-w-[220px] truncate">{t.subject}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 capitalize whitespace-nowrap">{t.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {t.event ? eventLabels[t.event] : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(t.channels ?? []).map((c) => (
                          <span key={c} className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                            {channelLabels[c]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.enabled ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === t.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={() => openView(t)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => openEdit(t)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(t); setOpenMenuId(null); }}
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
        )}
      </Card>

      {/* Create / Edit / View modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-900 text-sm">
                {modalMode === "create" ? "Create template" : modalMode === "edit" ? "Edit template" : "Template details"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === "view" && activeTemplate ? (
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Name</p>
                  <p className="text-sm font-medium text-slate-900">{activeTemplate.name}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Type</p>
                    <p className="text-sm text-slate-700 capitalize">{activeTemplate.type}</p>
                  </div>
                  {activeTemplate.event && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Event</p>
                      <p className="text-sm text-slate-700">{eventLabels[activeTemplate.event]}</p>
                    </div>
                  )}
                </div>
                {activeTemplate.subject && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Subject</p>
                    <p className="text-sm text-slate-700">{activeTemplate.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-1">Content</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line bg-gray-50 border border-gray-100 rounded-lg p-3">
                    {activeTemplate.content}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Variables</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplate.variables.length === 0 && <p className="text-xs text-slate-400">None detected</p>}
                    {activeTemplate.variables.map((v) => (
                      <span key={v} className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Channels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeTemplate.channels ?? []).map((c) => (
                      <span key={c} className="text-xs font-medium text-slate-700 bg-slate-100 rounded-full px-2 py-0.5">
                        {channelLabels[c]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Status</p>
                  <StatusBadge status={activeTemplate.enabled ? "active" : "inactive"} />
                </div>
                <Button fullWidth onClick={closeModal}>Close</Button>
              </div>
            ) : (
              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Welcome message"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TemplateType, event: "" }))}
                      className={inputCls}
                    >
                      <option value="broadcast">Broadcast</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Event</label>
                    <select
                      value={form.event}
                      onChange={(e) => setForm((f) => ({ ...f, event: e.target.value as TemplateEvent }))}
                      disabled={form.type !== "event"}
                      className={`${inputCls} disabled:bg-gray-50 disabled:text-slate-400`}
                    >
                      <option value="">Select event…</option>
                      {eventOptions.map((ev) => (
                        <option key={ev} value={ev}>{eventLabels[ev]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Email subject / notification headline (optional)"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder={"Use {{variable}} placeholders, e.g. Hi {{name}}, welcome to {{app_name}}!"}
                    rows={5}
                    className={`${inputCls} resize-none font-mono text-xs`}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formVariables.length === 0 ? (
                      <p className="text-xs text-slate-400">No variables detected yet</p>
                    ) : (
                      formVariables.map((v) => (
                        <span key={v} className="text-[10px] font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                          {`{{${v}}}`}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Channels</label>
                  <div className="space-y-1 border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {channelOptions.map((c) => (
                      <div key={c} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-slate-700">{channelLabels[c]}</span>
                        <Toggle value={form.channels.includes(c)} onChange={() => toggleChannel(c)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                  <span className="text-sm text-slate-700">Enabled</span>
                  <Toggle value={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
                  <Button fullWidth disabled={!valid || saving} loading={saving} onClick={saveTemplate}>
                    {saving ? "Saving..." : modalMode === "edit" ? "Save changes" : "Create template"}
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
                Deleting "{deleteTarget.name}" removes it permanently.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={confirmDelete}>Delete template</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
