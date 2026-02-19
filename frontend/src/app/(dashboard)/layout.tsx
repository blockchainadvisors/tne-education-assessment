"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types";
import { Spinner, Badge } from "@/components/ui";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Assessments", href: "/assessments", icon: ClipboardList },
  { name: "Benchmarks", href: "/benchmarks", icon: BarChart3 },
  { name: "Admin", href: "/admin", icon: Shield },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = apiClient.getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    apiClient
      .get<User>("/users/me")
      .then(setUser)
      .catch(() => {
        apiClient.clearTokens();
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    apiClient.clearTokens();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-600 focus:shadow-lg focus:ring-2 focus:ring-brand-600"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role={sidebarOpen ? "dialog" : undefined}
        aria-modal={sidebarOpen ? "true" : undefined}
        aria-label="Navigation sidebar"
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              T
            </div>
            <span className="text-lg font-semibold text-white">
              TNE Assess
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tenant info */}
        {user?.tenant && (
          <div className="mx-4 mb-4 rounded-lg bg-slate-800 px-3 py-2">
            <p className="text-xs font-medium text-slate-400">Institution</p>
            <p className="truncate text-sm font-semibold text-white">
              {user.tenant.name}
            </p>
          </div>
        )}

        <nav className="space-y-1 px-3">
          {navigation
            .filter((item) => {
              if (item.href === "/admin") {
                return user?.role === "super_admin" || user?.role === "tenant_admin";
              }
              return true;
            })
            .map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-slate-600">
              {navigation.find((n) => pathname.startsWith(n.href))?.name ||
                "Dashboard"}
            </h2>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="hidden font-medium sm:block">
                {user?.full_name || "User"}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-200">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email}
                    </p>
                    <Badge variant="brand" className="mt-1">
                      {user?.role?.replace("_", " ")}
                    </Badge>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
