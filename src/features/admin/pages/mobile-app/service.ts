import { apiClient } from "@shared/api/apiClient";

// The real payload sits one `.data` deep (Laravel HttpResponse wrapper) — same
// envelope every other admin service unwraps.
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type AppRelease = {
  id: number;
  version_name: string;
  version_code: number;
  platform: string;
  notes: string | null;
  file_name: string;
  size: number;
  mime: string | null;
  is_active: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
  // Server-appended (see App\Models\AppRelease).
  download_url: string;
  size_label: string;
};

export type UploadReleasePayload = {
  file: File;
  version_name: string;
  version_code?: string;
  platform?: string;
  notes?: string;
};

export const appReleaseService = {
  list: (): Promise<AppRelease[]> =>
    apiClient
      .get<ApiEnvelope<AppRelease[]>>("/app/releases")
      .then((r) => r.data.data),

  // Multipart, mirroring generalService.uploadLogo — the Universal Table API
  // only accepts JSON, so the APK goes to the dedicated AppReleaseController.
  upload: (payload: UploadReleasePayload): Promise<AppRelease> => {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("version_name", payload.version_name);
    if (payload.version_code) formData.append("version_code", payload.version_code);
    if (payload.platform) formData.append("platform", payload.platform);
    if (payload.notes) formData.append("notes", payload.notes);
    return apiClient
      .post<ApiEnvelope<AppRelease>>("/app/releases", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },

  remove: (id: number): Promise<void> =>
    apiClient.delete(`/app/releases/${id}`).then(() => undefined),
};
