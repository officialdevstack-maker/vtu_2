import { useState } from "react";
import { ExternalLink, Route, SlidersHorizontal, Send } from "lucide-react";
import {
  Button,
  Card,
  Toggle,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  affiliateControlsService,
  childDirectiveService,
  getControls,
  type AffiliateControlsState,
  type ProcessFlagKey,
  type ProviderRouteSlot,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import { extractErrorMessage } from "./modals";

// Each control here is DESIRED state: saving queues a directive the child
// applies on its next poll (~5 min) and persists what we asked for into
// config.controls so this page survives reloads. Whether the child actually
// applied it is only visible as the directive's status on the Directives page
// — the child never reports its live values back.

const PROCESS_FLAGS: { key: ProcessFlagKey; label: string; description: string }[] = [
  { key: "is_verify_email", label: "Email verification", description: "Require new customers to verify their email." },
  { key: "flutterwave", label: "Flutterwave funding", description: "Card/bank funding through Flutterwave." },
  { key: "monnify", label: "Monnify funding", description: "Virtual-account funding through Monnify." },
  { key: "monnify_atm", label: "Monnify card", description: "Card funding through Monnify." },
  { key: "wema", label: "Wema accounts", description: "Wema virtual account numbers." },
  { key: "earning", label: "Earnings", description: "The child app's earnings/rewards feature." },
  { key: "referral", label: "Referrals", description: "The child app's referral program." },
];

const SLOTS: ProviderRouteSlot[] = ["1", "2", "3"];

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Route;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-start gap-2.5">
        <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export default function AffiliateControlsPage() {
  const { instance, setInstance } = useAffiliate();
  const id = String(instance.id);
  const controls = getControls(instance);

  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // ── Redirect all ──
  const [redirectEnabled, setRedirectEnabled] = useState(controls.redirect_all?.enabled ?? false);
  const [redirectUrl, setRedirectUrl] = useState(controls.redirect_all?.target_url ?? "");
  const [savingRedirect, setSavingRedirect] = useState(false);

  // ── Provider routes ──
  // password is directive-only (never persisted into config.controls) — it's
  // the credential the child writes into its adex_api slot, e.g. the parent
  // account funding a tunneled slot.
  const [routes, setRoutes] = useState<Record<ProviderRouteSlot, { website_url: string; username: string; password: string }>>({
    "1": { website_url: controls.provider_routes?.["1"]?.website_url ?? "", username: controls.provider_routes?.["1"]?.username ?? "", password: "" },
    "2": { website_url: controls.provider_routes?.["2"]?.website_url ?? "", username: controls.provider_routes?.["2"]?.username ?? "", password: "" },
    "3": { website_url: controls.provider_routes?.["3"]?.website_url ?? "", username: controls.provider_routes?.["3"]?.username ?? "", password: "" },
  });
  const [savingRoutes, setSavingRoutes] = useState(false);

  // ── Tunnel-all ──
  // Points every provider slot at this parent in one action. The child handles
  // slots 1-5, so tunnel-all covers all of them (the manual reroute UI above
  // only exposes 1-3). Password is directive-only, never persisted.
  const [tunnelEnabled, setTunnelEnabled] = useState<boolean>(
    controls.tunnel_all?.enabled ?? false,
  );
  const [tunnelUrl, setTunnelUrl] = useState<string>(
    controls.tunnel_all?.parent_url ||
      (typeof window !== "undefined" ? window.location.origin : ""),
  );
  const [tunnelUsername, setTunnelUsername] = useState<string>(
    controls.tunnel_all?.username ?? "",
  );
  const [tunnelPassword, setTunnelPassword] = useState<string>("");
  const [savingTunnel, setSavingTunnel] = useState(false);

  // ── Process flags ──
  const [flags, setFlags] = useState<Partial<Record<ProcessFlagKey, boolean>>>(
    controls.process_flags?.values ?? {},
  );
  const [savingFlags, setSavingFlags] = useState(false);

  const persist = async (
    next: AffiliateControlsState,
    note: string,
  ) => {
    const updated = await affiliateControlsService.save(instance, { ...controls, ...next });
    setInstance(updated);
    setSavedNote(note);
    setError(null);
  };

  const saveRedirect = async () => {
    if (redirectEnabled && !redirectUrl.trim()) {
      setError("A target URL is required to redirect all users.");
      return;
    }
    setSavingRedirect(true);
    try {
      await childDirectiveService.create(id, "redirect_all_users", {
        enabled: redirectEnabled,
        target_url: redirectUrl.trim(),
      });
      await persist(
        { redirect_all: { enabled: redirectEnabled, target_url: redirectUrl.trim(), updated_at: new Date().toISOString() } },
        "Redirect directive queued — the affiliate applies it on its next poll.",
      );
    } catch (err) {
      setError(extractErrorMessage(err, "Could not queue the redirect directive."));
    } finally {
      setSavingRedirect(false);
    }
  };

  const saveRoutes = async () => {
    const filled = SLOTS.filter((s) => routes[s].website_url.trim() !== "");
    if (filled.length === 0) {
      setError("Fill in at least one provider slot to reroute.");
      return;
    }
    setSavingRoutes(true);
    try {
      for (const slot of filled) {
        await childDirectiveService.create(id, "reroute_provider", {
          slot,
          website_url: routes[slot].website_url.trim(),
          ...(routes[slot].username.trim() ? { username: routes[slot].username.trim() } : {}),
          ...(routes[slot].password.trim() ? { password: routes[slot].password.trim() } : {}),
        });
      }
      const now = new Date().toISOString();
      await persist(
        {
          provider_routes: Object.fromEntries(
            filled.map((s) => [s, { website_url: routes[s].website_url.trim(), username: routes[s].username.trim() || undefined, updated_at: now }]),
          ),
        },
        `Reroute directive${filled.length === 1 ? "" : "s"} queued for slot${filled.length === 1 ? "" : "s"} ${filled.join(", ")}.`,
      );
    } catch (err) {
      setError(extractErrorMessage(err, "Could not queue the reroute directives."));
    } finally {
      setSavingRoutes(false);
    }
  };

  const saveTunnelAll = async () => {
    if (tunnelEnabled) {
      if (!tunnelUrl.trim()) {
        setError("The parent URL is required to tunnel transactions here.");
        return;
      }
      if (!tunnelUsername.trim() || !tunnelPassword.trim()) {
        setError(
          "A funding-account username and password are required — that's the parent account whose wallet pays for the tunneled transactions.",
        );
        return;
      }
    }
    setSavingTunnel(true);
    try {
      // Point every slot the child supports (1-5) at this parent, so any plan
      // mapped to any slot now vends here. Turning the toggle off queues no
      // reroute (the parent can't know the child's original providers); it just
      // records intent — reroute the slots back manually to undo.
      if (tunnelEnabled) {
        const url = tunnelUrl.trim().replace(/\/+$/, "");
        for (const slot of ["1", "2", "3", "4", "5"]) {
          await childDirectiveService.create(id, "reroute_provider", {
            slot,
            website_url: url,
            username: tunnelUsername.trim(),
            password: tunnelPassword.trim(),
          });
        }
      }
      await persist(
        {
          tunnel_all: {
            enabled: tunnelEnabled,
            parent_url: tunnelUrl.trim(),
            username: tunnelUsername.trim() || undefined,
            updated_at: new Date().toISOString(),
          },
        },
        tunnelEnabled
          ? "Tunnel-all directives queued for all 5 slots — every mapped plan will vend on this platform once the affiliate polls."
          : "Tunnel-all turned off. Reroute the slots back to their own providers to fully undo.",
      );
      setTunnelPassword("");
    } catch (err) {
      setError(extractErrorMessage(err, "Could not queue the tunnel-all directives."));
    } finally {
      setSavingTunnel(false);
    }
  };

  const saveFlags = async () => {
    setSavingFlags(true);
    try {
      await childDirectiveService.create(id, "update_settings", { settings: flags });
      await persist(
        { process_flags: { values: flags, updated_at: new Date().toISOString() } },
        "Settings directive queued — the affiliate applies it on its next poll.",
      );
    } catch (err) {
      setError(extractErrorMessage(err, "Could not queue the settings directive."));
    } finally {
      setSavingFlags(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {error}
        </div>
      )}
      {savedNote && !error && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
          {savedNote}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <SectionCard
            icon={ExternalLink}
            title="Redirect all users"
            description="Send every customer of this affiliate to another site (e.g. during migration or shutdown)."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Redirect active</p>
                  <p className="text-xs text-slate-400">
                    {controls.redirect_all?.updated_at
                      ? `Last asked: ${new Date(controls.redirect_all.updated_at).toLocaleString()}`
                      : "Never requested"}
                  </p>
                </div>
                <Toggle value={redirectEnabled} onChange={setRedirectEnabled} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Target URL</label>
                <input
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://your-main-site.example"
                  className={`${inputCls} font-mono`}
                  disabled={!redirectEnabled}
                />
              </div>
              <Button
                size="sm"
                fullWidth
                disabled={savingRedirect}
                loading={savingRedirect}
                onClick={() => void saveRedirect()}
              >
                <Send className="w-3.5 h-3.5" /> Queue redirect directive
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            icon={SlidersHorizontal}
            title="Process toggles"
            description="Feature switches written verbatim into the child app's settings table."
          >
            <div className="space-y-1">
              {PROCESS_FLAGS.map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700">{label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{description}</p>
                  </div>
                  <Toggle
                    value={flags[key] ?? false}
                    onChange={(v) => setFlags((f) => ({ ...f, [key]: v }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                fullWidth
                disabled={savingFlags}
                loading={savingFlags}
                onClick={() => void saveFlags()}
              >
                <Send className="w-3.5 h-3.5" /> Queue settings directive
              </Button>
              {controls.process_flags?.updated_at && (
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Last asked: {new Date(controls.process_flags.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            icon={Route}
            title="Provider rerouting"
            description="Point the child's vending slots at different upstream providers."
          >
            <div className="space-y-4">
              {SLOTS.map((slot) => (
                <div key={slot} className="rounded-xl border border-slate-200 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">Slot {slot}</p>
                    {controls.provider_routes?.[slot]?.updated_at && (
                      <p className="text-[11px] text-slate-400">
                        Last asked: {new Date(controls.provider_routes[slot]!.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Provider website URL</label>
                    <input
                      value={routes[slot].website_url}
                      onChange={(e) => setRoutes((r) => ({ ...r, [slot]: { ...r[slot], website_url: e.target.value } }))}
                      placeholder="https://provider.example"
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Username (optional)</label>
                    <input
                      value={routes[slot].username}
                      onChange={(e) => setRoutes((r) => ({ ...r, [slot]: { ...r[slot], username: e.target.value } }))}
                      placeholder="Account on that provider"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Password (optional)</label>
                    <input
                      type="password"
                      value={routes[slot].password}
                      onChange={(e) => setRoutes((r) => ({ ...r, [slot]: { ...r[slot], password: e.target.value } }))}
                      placeholder="Sent to the child once — not stored here"
                      className={inputCls}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      To tunnel this slot through this platform, use the URL of this site plus the username and
                      password of the account that should fund the transactions.
                    </p>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                fullWidth
                disabled={savingRoutes}
                loading={savingRoutes}
                onClick={() => void saveRoutes()}
              >
                <Send className="w-3.5 h-3.5" /> Queue reroute directives
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
