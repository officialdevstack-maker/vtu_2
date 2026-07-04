import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { status: boolean; message: string; data: T };
export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number | null;
  to: number | null;
};
type Paginated<T> = { data: T[] } & PaginatedMeta;

export type Provider = {
  id: string | number;
  name: string;
  code?: string | null;
  balance?: string | number | null;
  connection?: boolean | null;
  username?: string | null;
  password?: string | null;
  sub_category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProviderPayload = {
  name: string;
  code?: string | null;
  username?: string | null;
  password?: string | null;
  sub_category?: string | null;
  connection?: boolean;
};

export type PageResult = { data: Provider[]; meta: PaginatedMeta };

const BASE = "/table/vendors";

export const providerService = {
  getPage: (page: number): Promise<PageResult> =>
    apiClient
      .get<ApiEnvelope<Paginated<Provider>>>(BASE, { params: { page } })
      .then((r) => {
        const { data, ...meta } = r.data.data;
        return { data, meta };
      }),

  getAll: (): Promise<Provider[]> =>
    apiClient
      .get<ApiEnvelope<Paginated<Provider>>>(BASE)
      .then((r) => r.data.data.data),

  create: (payload: ProviderPayload): Promise<Provider> =>
    apiClient
      .post<ApiEnvelope<Provider>>(BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<ProviderPayload>): Promise<Provider> =>
    apiClient
      .put<ApiEnvelope<Provider>>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),

  toggleConnection: (p: Provider): Promise<Provider> =>
    apiClient
      .put<ApiEnvelope<Provider>>(`${BASE}/${p.id}`, {
        connection: !p.connection,
      })
      .then((r) => r.data.data),

  refreshToken: (id: string): Promise<string> =>
    apiClient
      .get<ApiEnvelope<{ identifier: string }>>(
        `/admin/vendor/${id}/refresh-token`,
      )
      .then((r) => r.data.data.identifier),
};
