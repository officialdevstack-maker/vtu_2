import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type ServiceControlItem = {
  id: string | number;
  name: string;
  category: string;
  sub_category: string;
  isActive: boolean;
  isDevLock: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

// Backend groups rows two levels deep: category -> sub_category -> items.
// Dev-locked rows (isDevLock=1) are excluded server-side already.
export type ServiceControlGroups = Record<
  string,
  Record<string, ServiceControlItem[]>
>;

const BASE = "/admin/controls";

export const serviceControlService = {
  getAll: (): Promise<ServiceControlGroups> =>
    apiClient
      .get<ApiEnvelope<{ control: ServiceControlGroups }>>(BASE)
      .then((r) => r.data.data.control),

  toggle: (item: ServiceControlItem): Promise<void> =>
    apiClient
      .put<ApiEnvelope<unknown>>(`${BASE}/${item.id}`, {
        isActive: !item.isActive,
      })
      .then(() => undefined),
};
