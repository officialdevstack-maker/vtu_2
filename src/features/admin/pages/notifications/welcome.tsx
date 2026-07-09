import { useEffect, useState } from "react";
import { Mail, Eye, Trash2, CheckCircle2 } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  inputCls,
  SkeletonLine,
} from "../../../user/components/shared-ui";
import { WelcomeMessageModal } from "../../../user/components/welcome-message-modal";
import { welcomeMessageService, type WelcomeMessage } from "@shared/welcome-message";

export default function WelcomePage() {
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [saved, setSaved] = useState<WelcomeMessage | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    welcomeMessageService
      .getAdmin()
      .then((message) => {
        if (!mounted) return;
        setSaved(message);
        if (message) {
          setBody(message.body);
          setActive(message.active);
        }
      })
      .catch(() => mounted && setError("Could not load the welcome message."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const valid = body.trim().length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const message = await welcomeMessageService.save({ body: body.trim(), active });
      setSaved(message);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch {
      setError("The welcome message could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setRemoving(true);
    setError(null);
    try {
      await welcomeMessageService.remove();
      setSaved(null);
      setBody("");
      setActive(true);
    } catch {
      setError("The welcome message could not be removed right now.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#111827]/15 p-2.5">
              <Mail className="h-5 w-5 text-[#111827]" />
            </div>
            Welcome Message
          </div>
        }
        description="Shown to every user as a modal the next time they open their dashboard"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                <SkeletonLine className="h-24 w-full" />
                <SkeletonLine className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What should every user see when they open the app?"
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
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={!valid}
                    onClick={() => setPreviewing(true)}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </Button>
                  <Button fullWidth disabled={!valid || saving} loading={saving} onClick={handleSave}>
                    {justSaved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Saved
                      </>
                    ) : (
                      "Save & publish"
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Currently published
            </h2>
            {loading ? (
              <SkeletonLine className="h-16 w-full" />
            ) : saved ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Message</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line line-clamp-4">
                    {saved.body}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm text-slate-700">{saved.active ? "Active" : "Inactive"}</p>
                </div>
                {saved.updated_at && (
                  <div>
                    <p className="text-xs text-slate-400">Last updated</p>
                    <p className="text-sm text-slate-700">
                      {new Date(saved.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  loading={removing}
                  disabled={removing}
                  onClick={handleClear}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove message
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No welcome message published yet.</p>
            )}
          </Card>
        </div>
      </div>

      <WelcomeMessageModal open={previewing} message={body} onClose={() => setPreviewing(false)} />
    </div>
  );
}
