import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { serviceTabs } from "./service-tabs";

// Mobile-only action sheet that slides up when the "Services" tab is tapped,
// letting the user jump straight into any service without a separate hub
// page. Hidden on lg+ (desktop uses the sidebar).
//
// Standard bottom-sheet layering: backdrop (z-30) and panel (z-40) both sit
// above the bottom nav (z-20), so the nav is dimmed under the backdrop while
// the sheet is open. Close via the backdrop, the X, Escape, or picking a
// service. Rendered as sibling fixed layers so their z-indexes live in the
// page's root stacking context rather than a nested one.
export function MobileServicesSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop — sits below the nav so the nav stays tappable */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Services"
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-gray-200" />

        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Services</h2>
            <p className="text-xs text-slate-400">Pick a service to continue</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel covers the dimmed nav, so only the iOS home-indicator safe
            area needs clearing at the bottom. */}
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
          {serviceTabs.map((s) => (
            <button
              key={s.path}
              type="button"
              onClick={() => go(s.path)}
              className="flex flex-col items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-left transition active:scale-[0.98]"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.accent}`}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-900">{s.label}</span>
              <span className="text-[11px] leading-tight text-slate-400">
                {s.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
