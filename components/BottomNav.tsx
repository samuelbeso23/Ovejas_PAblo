"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, List, Wallet, Settings, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/scan-sheep", icon: ScanLine, label: "Escanear" },
  { href: "/lists", icon: List, label: "Listas" },
  { href: "/expenses", icon: Wallet, label: "Gastos" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:relative md:border-0">
      <div className="max-w-lg mx-auto flex justify-around py-2 md:py-4 md:gap-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[64px] transition-colors touch-manipulation ${
                isActive ? "text-primary-600 bg-primary-50" : "text-slate-500"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
