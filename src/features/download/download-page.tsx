import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ShieldCheck, Smartphone } from "lucide-react";
import { apiClient } from "@shared/api/apiClient";
import { useBranding } from "@shared/branding";

// Mirrors the public AppReleaseController::latest payload. Null while there is
// no published build yet.
type LatestRelease = {
  version_name: string;
  version_code: number;
  platform: string;
  notes: string | null;
  size_label: string;
  download_url: string;
  released_at: string;
} | null;

const DownloadPage = () => {
  const { app_name, logo } = useBranding();
  const [release, setRelease] = useState<LatestRelease>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get("/app/latest", { params: { platform: "android" } })
      .then((r) => setRelease(r.data?.data ?? null))
      .catch(() => setError("Could not load the app right now. Try again later."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#208AEF] to-[#0B5FB0] px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {app_name || "Vendify"}
        </Link>

        <div className="flex flex-col items-center text-center">
          {logo ? (
            <img
              src={logo}
              alt={app_name || "Vendify"}
              className="h-20 w-20 rounded-2xl bg-white/10 object-contain p-2 shadow-lg"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 shadow-lg">
              <Smartphone className="h-10 w-10" />
            </div>
          )}

          <h1 className="mt-5 text-2xl font-bold">
            Get the {app_name || "Vendify"} app
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Buy airtime, data, and pay bills faster — right from your phone.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 text-slate-800 shadow-xl">
          {loading ? (
            <div className="space-y-3">
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : !release ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center text-slate-500">
              <Smartphone className="h-8 w-8 text-slate-300" />
              <p className="text-sm">
                The Android app isn&apos;t available for download yet. Please
                check back soon.
              </p>
            </div>
          ) : (
            <>
              <a
                href={release.download_url}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#208AEF] px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#1a72c4]"
              >
                <Download className="h-5 w-5" />
                Download for Android
              </a>
              <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-500">
                <span>Version {release.version_name}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{release.size_label}</span>
              </div>

              {release.notes && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    What&apos;s new
                  </p>
                  <p className="whitespace-pre-line text-sm text-slate-600">
                    {release.notes}
                  </p>
                </div>
              )}

              <div className="mt-5 flex items-start gap-2 text-xs text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p>
                  After downloading, open the file and allow installs from this
                  source if prompted. This is the official {app_name || "Vendify"}{" "}
                  app.
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          iPhone user? The {app_name || "Vendify"} web app works great in Safari —
          just add it to your home screen.
        </p>
      </div>
    </div>
  );
};

export default DownloadPage;
