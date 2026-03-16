"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ShoppingCart, Handshake, CheckSquare, BarChart3, Settings } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Activos", icon: Building2 },
  { href: "/admin/compradores", label: "Compradores", icon: ShoppingCart },
  { href: "/admin/vendedores", label: "Vendedores", icon: Handshake },
  { href: "/admin/tareas", label: "Tareas", icon: CheckSquare, sep: true },
  { href: "/admin/informes", label: "Informes", icon: BarChart3 },
  { href: "/admin/config", label: "Config", icon: Settings, sep: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/assets");
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[72px] flex-col items-center bg-navy py-5 shadow-[3px_0_20px_rgba(0,0,0,0.25)]">
        <div className="mb-8 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Logo" className="h-8 w-8 object-contain" width={40} height={40} />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item, i) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {item.sep && <div className="my-2 h-px w-8 bg-white/[0.08]" />}
                <Link
                  href={item.href}
                  className={`flex w-14 flex-col items-center justify-center gap-1.5 rounded-lg py-2.5 transition-all ${
                    active ? "bg-white/[0.08] text-gold" : "text-white/40 hover:bg-white/[0.05] hover:text-white/70"
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                  <span className="text-[9px] font-medium uppercase tracking-[0.8px]">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex h-8 w-8 items-center justify-center rounded-full bg-navy3 text-[10px] font-semibold text-white/60">
          AD
        </div>
      </aside>

      <main className="ml-[72px] flex flex-1 flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
