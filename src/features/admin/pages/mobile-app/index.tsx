import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  CheckCircle2,
  Download,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Button,
  Card,
  PageHeader,
  SkeletonLine,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  ErrorBanner,
  Field,
  SectionTitle,
  extractErrorMessage,
} from "../settings/shared";
import {
  appReleaseService,
  type AppRelease,
  type UploadReleasePayload,
} from "./service";

// 200MB — matches AppReleaseController::MAX_KB. APKs are large.
const APK_MAX_BYTES = 200 * 1024 * 1024;

const uploadErrorMessage = (error: unknown) => {
  if (isAxiosError(error) && !error.response) {
    return "The upload was blocked before the server could process it. Ensure the server allows request bodies of at least 256 MB, then try again.";
  }

  return extractErrorMessage(error);
};

const MobileAppPage = () => {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState("");
  const [versionCode, setVersionCode] = useState("");
  const [notes, setNotes] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    appReleaseService
      .list()
      .then(setReleases)
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onFileSelected = (selected: File | undefined) => {
    setUploadError(null);
    setUploaded(false);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".apk")) {
      setUploadError("Select a .apk file.");
      return;
    }
    if (selected.size > APK_MAX_BYTES) {
      setUploadError("APK must be 200MB or smaller.");
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    setUploadError(null);
    if (!file) {
      setUploadError("Choose an APK to upload.");
      return;
    }
    if (!versionName.trim()) {
      setUploadError("Enter a version name, e.g. 1.0.0");
      return;
    }

    const payload: UploadReleasePayload = {
      file,
      version_name: versionName.trim(),
      platform: "android",
    };
    if (versionCode.trim()) payload.version_code = versionCode.trim();
    if (notes.trim()) payload.notes = notes.trim();

    setUploading(true);
    try {
      await appReleaseService.upload(payload);
      setUploaded(true);
      setFile(null);
      setVersionName("");
      setVersionCode("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
      window.setTimeout(() => setUploaded(false), 3000);
    } catch (err) {
      setUploadError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (release: AppRelease) => {
    if (
      !window.confirm(
        `Delete version ${release.version_name}? Users can no longer download it.`,
      )
    ) {
      return;
    }
    setDeletingId(release.id);
    try {
      await appReleaseService.remove(release.id);
      load();
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mobile App"
        description="Upload the Android app (APK). The newest upload becomes the version users download from the public app page and get prompted to update to in-app."
      />

      <Card className="p-5 space-y-5">
        <SectionTitle>Upload a new build</SectionTitle>

        {uploadError && <ErrorBanner message={uploadError} />}

        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className="hidden"
          onChange={(e) => onFileSelected(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-left transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Upload className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-800">
              {file ? file.name : "Choose APK file"}
            </span>
            <span className="block text-xs text-slate-500">
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB selected`
                : "Up to 200MB"}
            </span>
          </span>
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Version name *">
            <input
              className={inputCls}
              placeholder="1.0.0"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
            />
          </Field>
          <Field label="Version code (optional)">
            <input
              className={inputCls}
              placeholder="Auto (next number)"
              inputMode="numeric"
              value={versionCode}
              onChange={(e) =>
                setVersionCode(e.target.value.replace(/[^0-9]/g, ""))
              }
            />
          </Field>
        </div>

        <Field label="Release notes (optional)">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            placeholder="What changed in this version…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div className="flex justify-end">
          <Button
            onClick={() => void handleUpload()}
            loading={uploading}
            disabled={uploading}
          >
            {uploaded ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Published
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Publish build
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionTitle>Uploaded builds</SectionTitle>

        {loadError && <ErrorBanner message={loadError} />}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonLine key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
            <Smartphone className="h-8 w-8" />
            <p className="text-sm">No builds uploaded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {releases.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      v{r.version_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      code {r.version_code}
                    </span>
                    {r.is_active && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {r.size_label} · {r.downloads} downloads ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  {r.notes && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {r.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={r.download_url}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleDelete(r)}
                    disabled={deletingId === r.id}
                    className="inline-flex items-center justify-center rounded-lg border border-red-100 p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Delete version ${r.version_name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default MobileAppPage;
