import { useState } from "react";
import { UserCog, LogOut } from "lucide-react";
import { useAuth } from "../providers/auth";
import { isImpersonating, stopImpersonation } from "../impersonation";

// Fixed strip shown while an admin is signed in as a customer — the only
// affordance for getting back to the admin session without re-logging in.
export function ImpersonationBanner() {
  const { user } = useAuth();
  const [ending, setEnding] = useState(false);

  if (!isImpersonating()) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-white">
      <UserCog className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        Viewing {user?.username || user?.fullname || "this customer"}'s account
        as an admin.
      </span>
      <button
        onClick={() => {
          setEnding(true);
          void stopImpersonation();
        }}
        disabled={ending}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/20 px-2 py-1 font-semibold transition-colors hover:bg-white/30 disabled:opacity-60"
      >
        <LogOut className="h-3 w-3" />
        {ending ? "Returning…" : "Return to admin"}
      </button>
    </div>
  );
}
