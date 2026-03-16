"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/context";
import { fmt, fmtM } from "@/lib/utils";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";

export default function PortalPage() {
  const { assets } = useApp();
  const publicAssets = useMemo(() => assets.filter(a => a.pub), [assets]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return publicAssets;
    return publicAssets.filter(a => {
      const blob = [a.pob, a.prov, a.tip, a.addr, a.cp].join(" ").toLowerCase();
      return blob.includes(q.toLowerCase());
    });
  }, [publicAssets, q]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 rounded-xl bg-gradient-to-br from-navy to-navy3 p-10 text-center">
        <h1 className="text-3xl font-bold text-white">Propiedades Disponibles</h1>
        <p className="mt-2 text-sm text-white/40">Descubre oportunidades inmobiliarias seleccionadas</p>
        <div className="mx-auto mt-5 max-w-xl relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input className="w-full rounded-lg border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold/50 focus:ring-2 focus:ring-gold/10" placeholder="Buscar por municipio, provincia, tipo..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">{filtered.length} propiedades publicadas</p>

      <div className="grid grid-cols-3 gap-5">
        {filtered.map(a => (
          <Link key={a.id} href={`/portal/${a.id}`} className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.map} alt={a.pob} className="h-[180px] w-full object-cover transition-transform group-hover:scale-[1.02]" />
            <div className="p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="rounded-md bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy">{a.tip}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted"><MapPin size={10} /> {a.cp}</span>
              </div>
              <h3 className="text-base font-semibold text-navy">{a.pob}, {a.prov}</h3>
              <p className="mt-0.5 truncate text-xs text-muted">{a.addr}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl font-bold text-navy">{fmt(a.precio)}</span>
                {a.sqm && <span className="text-xs text-muted">{fmtM(a.sqm)}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Building size={40} strokeWidth={1} className="mx-auto text-border" />
          <p className="mt-3 text-sm text-muted">No hay propiedades que coincidan con tu búsqueda</p>
        </div>
      )}
    </div>
  );
}

import { Building } from "lucide-react";
