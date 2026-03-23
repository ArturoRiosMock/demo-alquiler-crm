"use client";

import { use, useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { fmt, fmtM } from "@/lib/utils";
import type { Asset } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft, Lock, FileText, MessageSquare, MapPin, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createOferta } from "@/app/actions/ofertas";
import { fetchCompradorByEmail, ensureCompradorForEmail } from "@/app/actions/compradores";
import { getDevAuthFromDocument } from "@/lib/dev-auth-client";

/* eslint-disable @next/next/no-img-element */
export default function PortalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getAsset } = useApp();
  const asset = getAsset(id);
  const [showOfertaModal, setShowOfertaModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; nombre: string } | null>(null);
  const [userResolved, setUserResolved] = useState(false);

  useEffect(() => {
    const dev = getDevAuthFromDocument();
    if (!dev || dev.role !== "cliente") {
      setCurrentUser(null);
    } else {
      setCurrentUser({ email: dev.email, nombre: dev.nombre });
    }
    setUserResolved(true);
  }, []);

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
              <p className="mb-4 text-xs leading-relaxed text-white/40">Presenta una oferta para acceder a datos completos: propietario, referencia catastral, fase judicial, documentación.</p>
              <button
                type="button"
                disabled={!userResolved}
                onClick={() => {
                  if (!userResolved) return;
                  if (!currentUser) {
                    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
                    return;
                  }
                  setShowOfertaModal(true);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold py-2.5 text-xs font-medium text-white hover:bg-gold2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={12} /> Presentar oferta
              </button>
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

      {showOfertaModal && currentUser && (
        <OfertaModal
          asset={asset}
          assetId={id}
          currentUser={currentUser}
          onClose={() => setShowOfertaModal(false)}
        />
      )}
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

function OfertaModal({
  asset,
  assetId,
  currentUser,
  onClose,
}: {
  asset: Asset;
  assetId: string;
  currentUser: { email: string; nombre: string };
  onClose: () => void;
}) {
  const [compradorId, setCompradorId] = useState<string | null>(null);
  const [resolvingComprador, setResolvingComprador] = useState(true);
  const [propuesta, setPropuesta] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resolveAttempt, setResolveAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setResolvingComprador(true);
      setError("");
      try {
        let row = await fetchCompradorByEmail(currentUser.email);
        let id = row?.id ?? null;
        if (!id) {
          id = await ensureCompradorForEmail(currentUser.email, currentUser.nombre);
        }
        if (!cancelled) setCompradorId(id);
      } catch (err) {
        if (!cancelled) {
          setCompradorId(null);
          setError(err instanceof Error ? err.message : "No se pudo preparar tu perfil de comprador");
        }
      } finally {
        if (!cancelled) setResolvingComprador(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser.email, currentUser.nombre, resolveAttempt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compradorId) {
      setError("Espera a que termine de cargar tu perfil o inténtalo de nuevo");
      return;
    }
    const euros = parseFloat(propuesta.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(euros) || euros <= 0) {
      setError("Ingresa una propuesta válida en euros");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createOferta({
        compradorId,
        assetId,
        propuestaEuros: euros,
        comentarios: comentarios.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la oferta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-navy">Presentar oferta</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-cream hover:text-navy"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4 rounded-lg border border-border bg-navy/5 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Tus datos</div>
            <div className="mt-1 text-sm font-medium text-navy">{currentUser.nombre}</div>
            <div className="text-xs text-muted">{currentUser.email}</div>
          </div>
          {resolvingComprador && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-cream2 px-3 py-2.5 text-xs text-muted">
              <Loader2 size={14} className="animate-spin text-gold" />
              Preparando tu perfil de comprador…
            </div>
          )}
          {!resolvingComprador && !compradorId && error && (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-red/20 bg-red/5 px-3 py-2.5 text-xs text-red">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setResolveAttempt((n) => n + 1);
                }}
                className="self-start rounded-md bg-navy px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy3"
              >
                Reintentar
              </button>
            </div>
          )}
          <div className="mb-4 rounded-lg border border-border bg-cream2 p-3">
            <div className="text-xs font-semibold text-muted">Activo</div>
            <div className="text-sm font-medium text-navy">{asset.pob}, {asset.prov}</div>
            <div className="text-xs text-muted">{asset.id}</div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-navy">
              Propuesta en euros <span className="text-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">€</span>
              <input
                type="text"
                value={propuesta}
                onChange={(e) => setPropuesta(e.target.value)}
                placeholder="0,00"
                required
                disabled={resolvingComprador || !compradorId}
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-8 pr-4 text-sm text-text outline-none placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/5 disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">Precio estimado: {fmt(asset.precio)}</p>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-navy">Comentarios (opcional)</label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
              placeholder="Añade información adicional sobre tu oferta..."
              disabled={resolvingComprador || !compradorId}
              className="w-full rounded-lg border border-border bg-white p-3 text-sm text-text outline-none placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/5 disabled:opacity-50"
            />
          </div>

          {error && compradorId && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red/10 px-3 py-2 text-xs text-red">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {success && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-green/10 px-3 py-2 text-xs text-green">
              <CheckCircle2 size={14} /> Oferta enviada correctamente. El administrador la revisará.
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-xs font-medium text-navy hover:bg-cream"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || resolvingComprador || !compradorId || !propuesta.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold px-4 py-2.5 text-xs font-medium text-white hover:bg-gold2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar oferta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
