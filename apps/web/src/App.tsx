import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routeLoaders } from "./lib/route-loaders";
import { BillingSkeleton, DashboardSkeleton, FormPageSkeleton, TablePageSkeleton } from "./components/page-skeletons";
import AppLayout from "./pages/(app)/layout";

const LoginPage = lazy(routeLoaders.login);
const DashboardPage = lazy(routeLoaders.dashboard);
const BillingNewPage = lazy(routeLoaders.billingNew);
const OrdersPage = lazy(routeLoaders.orders);
const CustomersPage = lazy(routeLoaders.customers);
const CustomerProfilePage = lazy(routeLoaders.customerProfile);
const ServicesPage = lazy(routeLoaders.services);
const BranchesPage = lazy(routeLoaders.branches);
const CashiersPage = lazy(routeLoaders.cashiers);
const ReportsPage = lazy(routeLoaders.reports);
const SettingsPage = lazy(routeLoaders.settings);
const DangerZonePage = lazy(routeLoaders.dangerZone);
const OrderStatusPage = lazy(routeLoaders.orderStatus);
const OrderPrintPage = lazy(routeLoaders.orderPrint);

function RouteFallback({ kind }: { kind: "plain" | "dashboard" | "billing" | "table" | "form" }) {
  switch (kind) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "billing":
      return <BillingSkeleton />;
    case "table":
      return <TablePageSkeleton />;
    case "form":
      return <FormPageSkeleton />;
    default:
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-ink">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
            Loading...
          </div>
        </div>
      );
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteFallback kind="plain" />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/orders/status"
          element={
            <Suspense fallback={<RouteFallback kind="plain" />}>
              <OrderStatusPage />
            </Suspense>
          }
        />
        <Route
          path="/orders/:id/print"
          element={
            <Suspense fallback={<RouteFallback kind="plain" />}>
              <OrderPrintPage />
            </Suspense>
          }
        />

        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<RouteFallback kind="dashboard" />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/billing/new"
            element={
              <Suspense fallback={<RouteFallback kind="billing" />}>
                <BillingNewPage />
              </Suspense>
            }
          />
          <Route
            path="/orders"
            element={
              <Suspense fallback={<RouteFallback kind="table" />}>
                <OrdersPage />
              </Suspense>
            }
          />
          <Route
            path="/customers"
            element={
              <Suspense fallback={<RouteFallback kind="table" />}>
                <CustomersPage />
              </Suspense>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <Suspense fallback={<RouteFallback kind="form" />}>
                <CustomerProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/services"
            element={
              <Suspense fallback={<RouteFallback kind="table" />}>
                <ServicesPage />
              </Suspense>
            }
          />
          <Route
            path="/branches"
            element={
              <Suspense fallback={<RouteFallback kind="table" />}>
                <BranchesPage />
              </Suspense>
            }
          />
          <Route
            path="/cashiers"
            element={
              <Suspense fallback={<RouteFallback kind="table" />}>
                <CashiersPage />
              </Suspense>
            }
          />
          <Route
            path="/reports"
            element={
              <Suspense fallback={<RouteFallback kind="dashboard" />}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<RouteFallback kind="form" />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/danger-zone"
            element={
              <Suspense fallback={<RouteFallback kind="form" />}>
                <DangerZonePage />
              </Suspense>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

