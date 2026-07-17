import { Clock3 } from "lucide-react";

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function SessionExpiryModal({
  seconds,
  extending,
  onStaySignedIn,
}: {
  seconds: number;
  extending: boolean;
  onStaySignedIn: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#111827]/65 px-4 backdrop-blur-sm" role="presentation">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expiry-title"
        aria-describedby="session-expiry-description"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111827] p-6 text-white shadow-2xl shadow-black/35"
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/[0.08] text-orange-300">
          <Clock3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="session-expiry-title" className="text-xl font-semibold tracking-tight">
          Your session is about to expire.
        </h2>
        <p id="session-expiry-description" className="mt-2 text-sm leading-6 text-slate-300">
          For your security, you’ll be signed out after this period of inactivity.
        </p>
        <div className="my-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Time remaining</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-orange-300" aria-live="polite">
            {formatCountdown(Math.max(0, seconds))}
          </span>
        </div>
        <button
          type="button"
          onClick={onStaySignedIn}
          disabled={extending}
          className="relative w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-[#111827] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300/60 disabled:cursor-wait disabled:opacity-70"
        >
          {extending ? "Extending session…" : "Stay signed in"}
          <span className="absolute right-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-orange-500" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
