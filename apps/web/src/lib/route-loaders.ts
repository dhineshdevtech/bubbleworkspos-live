export const routeLoaders = {
  login: () => import("../pages/(auth)/login/page"),
  dashboard: () => import("../pages/(app)/dashboard/page"),
  billingNew: () => import("../pages/(app)/billing/new/page"),
  orders: () => import("../pages/(app)/orders/page"),
  customers: () => import("../pages/(app)/customers/page"),
  customerProfile: () => import("../pages/(app)/customers/[id]/page"),
  services: () => import("../pages/(app)/services/page"),
  branches: () => import("../pages/(app)/branches/page"),
  cashiers: () => import("../pages/(app)/cashiers/page"),
  reports: () => import("../pages/(app)/reports/page"),
  settings: () => import("../pages/(app)/settings/page"),
  dangerZone: () => import("../pages/(app)/danger-zone/page"),
  orderStatus: () => import("../pages/orders/status/page"),
  orderPrint: () => import("../pages/orders/[id]/print/page"),
} as const;

type PrefetchableRoute =
  | "/dashboard"
  | "/billing/new"
  | "/orders"
  | "/customers"
  | "/services"
  | "/branches"
  | "/cashiers"
  | "/reports"
  | "/settings"
  | "/danger-zone";

const routeByPath: Record<PrefetchableRoute, () => Promise<unknown>> = {
  "/dashboard": routeLoaders.dashboard,
  "/billing/new": routeLoaders.billingNew,
  "/orders": routeLoaders.orders,
  "/customers": routeLoaders.customers,
  "/services": routeLoaders.services,
  "/branches": routeLoaders.branches,
  "/cashiers": routeLoaders.cashiers,
  "/reports": routeLoaders.reports,
  "/settings": routeLoaders.settings,
  "/danger-zone": routeLoaders.dangerZone,
};

const preloadedRoutes = new Set<PrefetchableRoute>();

export function prefetchRouteChunk(pathname: string) {
  const matched = (Object.keys(routeByPath) as PrefetchableRoute[]).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matched || preloadedRoutes.has(matched)) {
    return;
  }

  preloadedRoutes.add(matched);
  void routeByPath[matched]();
}
