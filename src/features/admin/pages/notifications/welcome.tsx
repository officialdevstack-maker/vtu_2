import { useState } from "react";
import { Mail, Eye, Trash2, CheckCircle2 } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  inputCls,
} from "../../../user/components/shared-ui";
import { WelcomeMessageModal } from "../../../user/components/welcome-message-modal";
import {
  clearWelcomeMessage,
  getWelcomeMessage,
  saveWelcomeMessage,
  type WelcomeMessage,
} from "@shared/welcome-message";

export default function WelcomePage() {
  const existing = getWelcomeMessage();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [active, setActive] = useState(existing?.active ?? true);
  const [saved, setSaved] = useState<WelcomeMessage | null>(existing);
  const [previewing, setPreviewing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const valid = title.trim().length > 0 && body.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    const message = saveWelcomeMessage({ title: title.trim(), body: body.trim(), active });
    setSaved(message);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleClear = () => {
    clearWelcomeMessage();
    setSaved(null);
    setTitle("");
    setBody("");
    setActive(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#111827]/15 p-2.5">
              <Mail className="h-5 w-5 text-[#111827]" />
            </div>
            Welcome Messages
          </div>
        }
        description="Configure the message shown to users the next time they open the app"
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        This is frontend-only for now â€” the message is stored locally in this browser
        (no backend endpoint exists yet) so it can be previewed end-to-end.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Welcome to Vendify VTU!"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What should new and returning users see?"
                rows={5}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-sm text-slate-700">Active</p>
                <p className="text-xs text-slate-400 mt-0.5">Show this message to users</p>
              </div>
              <Toggle value={active} onChange={setActive} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth disabled={!valid} onClick={() => setPreviewing(true)}>
                <Eye className="w-4 h-4" /> Preview
              </Button>
              <Button fullWidth disabled={!valid} onClick={handleSave}>
                {justSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : "Save & publish"}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Currently published
            </h2>
            {saved ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Title</p>
                  <p className="text-sm font-medium text-slate-900">{saved.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm text-slate-700">{saved.active ? "Active" : "Inactive"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Last updated</p>
                  <p className="text-sm text-slate-700">
                    {new Date(saved.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="danger" size="sm" fullWidth onClick={handleClear}>
                  <Trash2 className="w-3.5 h-3.5" /> Remove message
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No welcome message published yet.</p>
            )}
          </Card>
        </div>
      </div>

      <WelcomeMessageModal
        open={previewing}
        title={title}
        message={body}
        onClose={() => setPreviewing(false)}
      />
    </div>
  );
}
