"use client";

import clsx from "clsx";
import {
  Banknote,
  Building2,
  ClipboardList,
  Gauge,
  Loader2,
  LogOut,
  ReceiptText,
  Scissors,
  Settings,
  ShieldAlert,
  Users,
  UserCog,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  type ApiSession,
  getBranches,
  getServices,
  getProducts,
  getCategories,
  getRates,
  getSettings,
  getOrderNumberPreview,
  getOrders,
  getCustomers,
  getReports,
  logout
} from "@/lib/api";
import { clearSession, loadSession } from "@/lib/session";
import { prefetchRouteChunk } from "@/lib/route-loaders";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/billing/new", label: "New Bill", icon: ReceiptText },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/services", label: "Services", icon: Scissors },
  { href: "/branches", label: "Branches", icon: Building2 },
  { href: "/cashiers", label: "Cashiers", icon: UserCog },
  { href: "/reports", label: "Reports", icon: Banknote },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/danger-zone", label: "Danger Zone", icon: ShieldAlert },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<ApiSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleUpdate = () => {
      setSession(loadSession());
    };
    setSession(loadSession());
    setIsLoaded(true);
    window.addEventListener("session-updated", handleUpdate);
    return () => {
      window.removeEventListener("session-updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const timeoutId = window.setTimeout(() => {
      const routesToWarm = ["/dashboard", "/orders", "/customers"];
      if (session.user?.role !== "ADMIN") {
        routesToWarm.push("/billing/new");
      }
      routesToWarm.forEach((route) => prefetchRouteChunk(route));

      // Warm API cache for common data
      if (session.user?.role === "ADMIN") {
        void getBranches();
        void getServices();
        void getProducts();
        void getCategories();
        void getRates();
        void getSettings();
      } else {
        void getServices();
        void getProducts();
        void getCategories();
        void getRates();
        void getSettings();
        void getOrderNumberPreview(session.user?.branchId || undefined);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [session]);

  // Enforce page-level client-side role guards
  useEffect(() => {
    if (session) {
      const role = session.user?.role;
      const adminOnlyRoutes = ["/services", "/settings", "/branches", "/cashiers", "/reports", "/danger-zone"];
      const isTryingToAccessAdminRoute = adminOnlyRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      if (role === "CASHIER" && isTryingToAccessAdminRoute) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [session, pathname, navigate]);

  // Redirect to login if session is loaded and is null
  useEffect(() => {
    if (isLoaded && !session) {
      navigate("/login");
    }
  }, [isLoaded, session, navigate]);

  const onLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn("Sign out notice:", err);
    }
    clearSession();
    navigate("/login");
  };

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      const role = session?.user?.role;
      if (role === "ADMIN") {
        return item.href !== "/billing/new";
      }
      if (role === "CASHIER") {
        return !["/services", "/settings", "/branches", "/cashiers", "/reports", "/danger-zone"].includes(item.href);
      }
      return true;
    });
  }, [session]);

  if (!isLoaded || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <span className="text-sm text-muted font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  const handleNavPrefetch = (href: string) => {
    prefetchRouteChunk(href);

    // Warm API caches for hovered routes
    if (href === "/dashboard") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];
      void getReports(session?.user?.branchId || undefined, startDate, endDate);
      void getOrders({ branchId: session?.user?.branchId || undefined, page: 1, limit: 5 });
    } else if (href === "/billing/new") {
      void getServices();
      void getProducts();
      void getCategories();
      void getRates();
      void getSettings();
      void getOrderNumberPreview(session?.user?.branchId || undefined);
    } else if (href === "/orders") {
      void getOrders({ branchId: session?.user?.branchId || undefined, page: 1, limit: 10 });
    } else if (href === "/customers") {
      void getCustomers({ page: 1, limit: 25 });
    } else if (href === "/services") {
      void getRates();
      void getServices();
      void getProducts();
      void getCategories();
    } else if (href === "/branches") {
      void getBranches();
    } else if (href === "/reports") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];
      void getReports(session?.user?.branchId || undefined, startDate, endDate);
    } else if (href === "/settings") {
      void getSettings();
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink">
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-surface px-3 py-4 transition-transform duration-300 ease-in-out lg:hidden",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-5 flex items-center justify-between px-3">
          <div>
            <div className="text-lg font-semibold">Bubbleworks</div>
            <div className="text-sm text-muted">{session?.user.branch?.code ?? "Admin Console"}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white hover:bg-background"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={() => handleNavPrefetch(item.href)}
                onFocus={() => handleNavPrefetch(item.href)}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium focus-ring",
                  active ? "bg-brand text-white" : "text-ink hover:bg-[#e9f2f1]",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface px-3 py-4 lg:block">
        <div className="mb-5 px-3">
          <div className="text-lg font-semibold">Bubbleworks</div>
          <div className="text-sm text-muted">{session?.user.branch?.code ?? "Admin Console"}</div>
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                to={item.href}
                onMouseEnter={() => handleNavPrefetch(item.href)}
                onFocus={() => handleNavPrefetch(item.href)}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium focus-ring",
                  active ? "bg-brand text-white" : "text-ink hover:bg-[#e9f2f1]",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-line bg-surface px-4 shadow-panel md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white hover:bg-background lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="text-sm text-muted">{session?.user.role ?? "ADMIN"}</div>
              <div className="font-semibold">{session?.user.name ?? "Bubbleworks Admin"}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium hover:bg-background"
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </header>
        <main className="px-4 py-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
