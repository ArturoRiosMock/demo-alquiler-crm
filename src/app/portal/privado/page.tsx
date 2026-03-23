"use client";

import { useState, useEffect } from "react";
import { fetchPublicAssets } from "@/app/actions/assets";
import { signOut } from "@/app/login/actions";
import type { Asset } from "@/lib/types";
import { fmt, fmtM } from "@/lib/utils";
import Link from "next/link";
import { Building, MapPin, LogIn, LogOut, FileText } from "lucide-react";

export default function PortalPrivadoPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function handleLogout() {
    await signOut();
  }

  useEffect(() => {
    // Check dev-auth cookie for user
    const devCookie = document.cookie.split("; ").find(c => c.startsWith("dev-auth="));
    if (devCookie) {
      try {
        const dev = JSON.parse(decodeURIComponent(devCookie.split("=").slice(1).join("=")));
        setUserEmail(dev.email ?? null);
      } catch { /* ignore */ }
    }

    // Fetch published assets
    fetchPublicAssets().then((data) => {
      setAssets(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>;

  if (!userEmail) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-navy">Acceso requerido</h2>
        <p className="mb-6 text-sm text-muted">Inicia sesion para acceder a la zona privada</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login?redirect=/portal/privado" className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy3">
            <LogIn size={14} /> Iniciar sesion
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-navy hover:bg-cream">
            <LogOut size={14} /> Cerrar sesion actual
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 rounded-xl bg-gradient-to-br from-navy to-navy3 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Zona Privada</h1>
            <p className="mt-1 text-sm text-white/40">Acceso a tus activos y propiedades disponibles</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold"><Building size={20} /></div>
            <div>
              <div className="text-2xl font-bold text-navy">{assets.length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Activos disponibles</div>
            </div>
          </div>
        </div>
        <Link href="/portal/privado/ofertas" className="rounded-lg border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy"><FileText size={20} /></div>
            <div>
              <div className="text-sm font-semibold text-navy">Mis Ofertas</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Ver y gestionar</div>
            </div>
          </div>
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-navy">Propiedades disponibles</h2>
      <div className="grid grid-cols-3 gap-5">
        {assets.map(a => (
          <Link key={a.id} href={`/portal/privado/${a.id}`} className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.map} alt={a.pob} className="h-[160px] w-full object-cover transition-transform group-hover:scale-[1.02]" />
            <div className="p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="rounded-md bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy">{a.tip}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted"><MapPin size={10} /> {a.cp}</span>
              </div>
              <h3 className="text-base font-semibold text-navy">{a.pob}, {a.prov}</h3>
              <p className="mt-0.5 truncate text-xs text-muted">{a.addr}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-navy">{fmt(a.precio)}</span>
                {a.sqm && <span className="text-xs text-muted">{fmtM(a.sqm)}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="py-16 text-center">
          <Building size={40} className="mx-auto mb-3 text-border" />
          <p className="text-sm text-muted">No hay propiedades publicadas en este momento</p>
        </div>
      )}
    </div>
  );
}
