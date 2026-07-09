import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type RoutingVendor = { id: number; name: string };

// One routable dimension within a service (a data plan_type, cable network,
// disco, …). `route_key` is the machine value the resolver matches on;
// `provider_id` is the vendor currently assigned (null = unassigned).
export type ServiceRoute = {
  service_type: string;
  route_key: string;
  label: string;
  provider_id: number | null;
};

export type ServiceRouteGroup = {
  service_type: string;
  label: string;
  routes: ServiceRoute[];
};

export type ServiceRoutingMatrix = {
  vendors: RoutingVendor[];
  groups: ServiceRouteGroup[];
};

export type ServiceRouteUpdate = {
  service_type: string;
  route_key: string;
  provider_id: number | null;
};

const BASE = "/admin/service-routing";

export const serviceRoutingService = {
  // The set of rows is derived live from the catalog on the backend, so a new
  // network type / cable network / disco appears here with no schema change.
  get: (): Promise<ServiceRoutingMatrix> =>
    apiClient.get<ApiEnvelope<ServiceRoutingMatrix>>(BASE).then((r) => r.data.data),

  update: (routes: ServiceRouteUpdate[]): Promise<void> =>
    apiClient.put<ApiEnvelope<null>>(BASE, { routes }).then(() => undefined),
};
