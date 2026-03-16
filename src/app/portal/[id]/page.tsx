"use client";

import { use } from "react";
import { useApp } from "@/lib/context";
import { fmt, fmtM } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Lock, FileText, MessageSquare, MapPin } from "lucide-react";

/* eslint-disable @next/next/no-img-element */
export default function PortalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getAsset } = useApp();
  const asset = getAsset(id);

  if (!asset || !asset.pub) return (
    <div className="mx-auto max-w-7xl px-6 py-20 text-center">
      <Lock size={40} strokeWidth={1} className="mx-auto text-border" />
      <p className="mt-3 text-sm text-muted">Esta propiedad no está disponible públicamente</p>
      <Link href="/portal" className="mt-3 inline-block text-sm text-gold hover:underline">Volver al listado</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/portal" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-navy"><ArrowLeft size={14} /> Volver al listado</Link>

      <div className="grid grid-cols-[1fr_300px] gap-6">
        <div>
          <img src={asset.map} alt={asset.pob} className="mb-5 h-[300px] w-full rounded-xl border border-border object-cover" />

          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold after:h-px after:flex-1 after:bg-border">Información del Activo</div>
            <div className="grid grid-cols-3 gap-2">
              <InfoPill label="Tipo de inmueble" value={asset.bien} />
              <InfoPill label="Municipio" value={asset.pob} />
              <InfoPill label="Provincia" value={asset.prov} />
              <InfoPill label="Comunidad" value={asset.ccaa} />
              <InfoPill label="Código Postal" value={asset.cp} />
              <InfoPill label="Superficie" value={asset.supC || fmtM(asset.sqm)} />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold after:h-px after:flex-1 after:bg-border">Descripción</div>
            <p className="text-sm leading-[1.7] text-text">{asset.desc}</p>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Lock size={24} className="text-navy" />
              <p className="mt-2 text-sm font-semibold text-navy">Información reservada</p>
              <p className="mt-0.5 text-xs text-muted">Firma tu NDA para acceder a todos los datos</p>
            </div>
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold">Datos del Propietario</div>
            <div className="grid grid-cols-2 gap-2 blur-sm">
              <InfoPill label="Nombre" value="XXXXXXXXXXXX" />
              <InfoPill label="Teléfono" value="+34 XXXXXXXXX" />
              <InfoPill label="Email" value="XXXX@XXXX.com" />
              <InfoPill label="Ref. Catastral" value="XXXXXXXXXXXXXX" />
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-20 flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="mb-1 text-2xl font-bold text-navy">{fmt(asset.precio)}</div>
              <div className="mb-1 text-[11px] text-muted">Precio estimado</div>
              {asset.sqm && asset.precio && <div className="mb-4 text-xs text-muted">{asset.sqm} m² · {Math.round(asset.precio / asset.sqm).toLocaleString("es-ES")} €/m²</div>}
              <div className="flex flex-col gap-2">
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy py-3 text-xs font-medium text-white hover:bg-navy3"><FileText size={13} /> Solicitar información</button>
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-3 text-xs font-medium text-navy hover:bg-cream"><MessageSquare size={13} /> Contactar</button>
              </div>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-navy to-navy3 p-5">
              <div className="mb-2 text-sm font-semibold text-gold">Acceso Completo</div>
              <p className="mb-4 text-xs leading-relaxed text-white/40">Firma un NDA para acceder a datos completos: propietario, referencia catastral, fase judicial, documentación.</p>
              <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold py-2.5 text-xs font-medium text-white hover:bg-gold2"><Lock size={12} /> Solicitar NDA</button>
            </div>

            <div className="rounded-lg border border-border bg-white p-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Datos rápidos</div>
              <div className="flex flex-col gap-1.5">
                {[["Tipo", asset.tip], ["Ubicación", asset.pob], ["CCAA", asset.ccaa]].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{l}</span>
                    <span className="font-medium text-navy">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-cream2 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm text-text">{value}</div>
    </div>
  );
}
