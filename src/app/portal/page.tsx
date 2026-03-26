"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/lib/context";
import { fmt, fmtM } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Building, SlidersHorizontal, X } from "lucide-react";
import { Suspense } from "react";

function PortalContent() {
  const { assets } = useApp();
  const searchParams = useSearchParams();
  const publicAssets = useMemo(() => assets.filter(a => a.pub), [assets]);

  const [q, setQ] = useState(searchParams.get("pob") ?? "");
  const [tipo, setTipo] = useState(searchParams.get("tipo") ?? "");
  const [prov, setProv] = useState(searchParams.get("prov") ?? "");

  useEffect(() => {
    setQ(searchParams.get("pob") ?? "");
    setTipo(searchParams.get("tipo") ?? "");
    setProv(searchParams.get("prov") ?? "");
  }, [searchParams]);

  const filtered = useMemo(() => {
    return publicAssets.filter(a => {
      const matchQ = !q || [a.pob, a.prov, a.tip, a.addr, a.cp].join(" ").toLowerCase().includes(q.toLowerCase());
      const matchTipo = !tipo || a.tip.toLowerCase() === tipo.toLowerCase();
      const matchProv = !prov || a.prov.toLowerCase().includes(prov.toLowerCase());
      return matchQ && matchTipo && matchProv;
    });
  }, [publicAssets, q, tipo, prov]);

  const hasFilters = q || tipo || prov;

  function clearFilters() {
    setQ("");
    setTipo("");
    setProv("");
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
      {/* Header buscador */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy3 p-8 md:p-12">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Propiedades Disponibles</h1>
        <p className="mt-1 text-sm text-white/40">Descubre oportunidades inmobiliarias seleccionadas</p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
              placeholder="Buscar por municipio, provincia, dirección..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {tipo && (
              <span className="flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold">
                {tipo}
                <button onClick={() => setTipo("")}><X size={11} /></button>
              </span>
            )}
            {prov && (
              <span className="flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold">
                {prov}
                <button onClick={() => setProv("")}><X size={11} /></button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra resultados */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs text-muted">
          <span className="font-semibold text-navy">{filtered.length}</span> {filtered.length === 1 ? "propiedad" : "propiedades"} publicadas
          {hasFilters && <span className="text-muted"> · filtros activos</span>}
        </p>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-navy">
            <X size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid propiedades */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(a => (
            <Link
              key={a.id}
              href={`/portal/${a.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.map} alt={a.pob} className="h-[180px] w-full object-cover transition-transform group-hover:scale-[1.02]" />
              <div className="p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="rounded-md bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy">{a.tip}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted"><MapPin size={10} /> {a.prov}</span>
                </div>
                <h3 className="text-base font-semibold text-navy">{a.pob}, {a.prov}</h3>
                <p className="mt-0.5 truncate text-xs text-muted">{a.addr}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xl font-bold text-navy">{a.precio ? fmt(a.precio) : "Consultar"}</span>
                  {a.sqm && <span className="text-xs text-muted">{fmtM(a.sqm)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Building size={40} strokeWidth={1} className="mx-auto text-border" />
          <p className="mt-3 text-sm font-medium text-navy">No hay propiedades que coincidan</p>
          <p className="mt-1 text-xs text-muted">Prueba a ajustar los filtros de búsqueda</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 flex items-center gap-1.5 mx-auto text-xs font-semibold text-gold hover:text-gold2">
              <SlidersHorizontal size={12} /> Limpiar todos los filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense>
      <PortalContent />
    </Suspense>
  );
}
