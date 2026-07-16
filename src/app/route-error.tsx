import { useEffect } from "react";
import { Link, isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { AlertTriangle, Home, SearchX, Zap } from "lucide-react";
import { useBranding } from "@/shared/branding";

// Wired up as the root route's errorElement (see app/router.tsx) — React
// Router routes both thrown errors (a component/loader throwing, a lazy
// chunk failing to load after a redeploy) AND unmatched paths (404) here,
// so this one component covers both "page not found" and "something broke".
export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { app_name, logo } = useBranding();

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const statusCode = isRouteErrorResponse(error) ? error.status : null;

  useEffect(() => {
    if (!is404) {
      console.error("Route error boundary caught:", error);
    }
  }, [error, is404]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-black/10 overflow-hidden mb-6 ring-1 ring-slate-200/70">
        {logo ? (
          <img src={logo} alt={app_name} className="w-full h-full object-contain" />
        ) : (
          <Zap className="w-7 h-7 text-[#111827]" />
        )}
      </div>

      <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
        {is404 ? <SearchX className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
      </div>

      {is404 ? (
        <>
          <h1 className="text-lg font-semibold text-slate-900 mb-1.5">Page not found</h1>
          <p className="text-sm text-slate-500 max-w-sm mb-7">
            The page you're looking for doesn't exist, or may have moved.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold text-slate-900 mb-1.5">Something went wrong</h1>
          <p className="text-sm text-slate-500 max-w-sm mb-7">
            {statusCode
              ? `An unexpected error occurred (${statusCode}). Reloading the page usually fixes this.`
              : "An unexpected error occurred. Reloading the page usually fixes this."}
          </p>
        </>
      )}

      <div className="flex items-center gap-3">
        <Link
          to="/"
          onClick={(e) => {
            // Prefer client-side nav when possible so we don't lose an
            // already-warm session; fall back to a full navigation is
            // unnecessary since "/" always renders regardless of auth state.
            e.preventDefault();
            navigate("/");
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            is404
              ? "brand-primary-button border-transparent"
              : "border-gray-300 text-slate-700 hover:bg-gray-50"
          }`}
        >
          <Home className="w-4 h-4" /> Back to {app_name}
        </Link>
      </div>
    </div>
  );
}
