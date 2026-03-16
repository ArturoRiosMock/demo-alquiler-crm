"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream2">
      <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold3 text-[10px] font-bold text-navy">PC</div>
            <span className="text-base font-semibold text-navy">PropCRM</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/portal" className="text-sm font-medium text-navy hover:text-gold">Propiedades</Link>
            <Link href="/admin" className="text-sm font-medium text-muted hover:text-navy">Panel Admin</Link>
            <button className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-medium text-white hover:bg-navy3">
              <Lock size={12} /> Acceso Privado
            </button>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-navy py-6 text-center">
        <div className="text-sm font-medium text-white/50">PropCRM — Real Estate Asset Management</div>
        <div className="mt-0.5 text-xs text-white/25">Portal público · Solo activos publicados</div>
      </footer>
    </div>
  );
}
