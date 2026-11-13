"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  UtensilsCrossed,
  FileBarChart,
  BotMessageSquare,
  LogOut,
  AlertTriangle,
} from "lucide-react";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ingredients", label: "Bahan Baku", icon: Boxes },
    { href: "/stock/history", label: "Riwayat Stok", icon: ArrowLeftRight },
    { href: "/menus", label: "Master Menu", icon: UtensilsCrossed },
    { href: "/reports", label: "Laporan & Waste", icon: FileBarChart },
    { href: "/assistant/test", label: "Asisten Menu (AI)", icon: BotMessageSquare },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-stone-900 text-stone-100 p-4 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white">
            N
          </div>
          <span className="font-semibold text-lg tracking-tight">NaysIn</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-stone-800 text-amber-300 font-mono">
          {user.role}
        </span>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-200 border-r border-stone-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 hidden md:flex items-center gap-3 border-b border-stone-800">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white text-xl shadow-inner">
              N
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">NaysIn</h1>
              <p className="text-xs text-stone-400">Inventory & AI Nays Kopi</p>
            </div>
          </div>

          <div className="p-4">
            <div className="px-3 py-2 bg-stone-800/60 rounded-lg mb-4 text-xs">
              <p className="text-stone-400">Pengguna Aktif</p>
              <p className="font-medium text-stone-100 truncate">{user.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50 text-[10px]">
                {user.role}
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-rose-400 hover:bg-stone-800/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

