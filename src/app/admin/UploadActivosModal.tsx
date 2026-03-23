"use client";

import { useState, useRef } from "react";
import { useApp } from "@/lib/context";
import { parseExcelFile } from "@/lib/normalize-excel";
import { enrichAssetsWithCatastro } from "@/app/actions/catastro";
import { upsertAssets } from "@/app/actions/assets";
import { X, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UploadActivosModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadActivosModal({ open, onClose }: UploadActivosModalProps) {
  const { addAssets, assets: existing } = useApp();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loadingHint, setLoadingHint] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setStatus("error");
      setMessage("Solo se permiten archivos Excel (.xlsx o .xls).");
      return;
    }
    setStatus("loading");
    setMessage("");
    setLoadingHint("Leyendo y normalizando Excel…");
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        setStatus("error");
        setMessage("No se encontraron filas válidas en las hojas Proveedor 1, 2 o 3.");
        return;
      }
      const existingIds = new Set(existing.map(a => a.id));
      const toAdd = parsed.filter(a => !existingIds.has(a.id));
      const toUpdate = parsed.filter(a => existingIds.has(a.id));

      let enrichedNew: typeof parsed = [];
      const parts: string[] = [];

      if (toAdd.length > 0) {
        setLoadingHint(`Consultando Catastro y geocodificación (${toAdd.length} activo(s) nuevo(s))…`);
        const { assets, ok, skipped, failed, supabase } = await enrichAssetsWithCatastro(toAdd);
        enrichedNew = assets;
        parts.push(`${toAdd.length} nuevo(s): ${ok} ficha(s) completada(s) con datos del Catastro.`);
        if (skipped > 0) parts.push(`${skipped} sin referencia catastral válida (omitido enriquecimiento).`);
        if (failed.length > 0) {
          parts.push(`${failed.length} error(es) Catastro: ${failed.slice(0, 3).map(f => f.ref).join(", ")}${failed.length > 3 ? "…" : ""}.`);
        }
        if (supabase.attempted) {
          if (supabase.errors.length) {
            parts.push(`Supabase: ${supabase.errors.join("; ")}`);
          } else {
            parts.push(`Guardado en BD: ${supabase.inserted} alta(s), ${supabase.updated} actualización(es).`);
          }
        }
      }

      if (toUpdate.length > 0) {
        parts.push(`${toUpdate.length} activo(s) ya existente(s) actualizado(s) con datos del Excel.`);
      }

      if (parts.length === 0) {
        setMessage("No se procesaron filas.");
      } else {
        setMessage(parts.join(" "));
      }

      const mergedForUi = [...enrichedNew, ...toUpdate];
      addAssets(mergedForUi);

      if (mergedForUi.length > 0) {
        try {
          const db = await upsertAssets(mergedForUi);
          if (db.errors.length > 0) {
            setMessage((m) => `${m} Sincronización BD: ${db.errors.slice(0, 2).join("; ")}`);
          }
        } catch (err) {
          setMessage((m) =>
            `${m} No se guardó en base de datos: ${err instanceof Error ? err.message : "error desconocido"}. Revisa SUPABASE_SERVICE_ROLE_KEY en .env.local; sin BD los datos solo duran en memoria hasta recargar.`,
          );
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("propcrm-assets-updated"));
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Error al procesar el archivo.");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setMessage("");
    setLoadingHint("");
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-navy">Cargar activos desde Excel</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-cream hover:text-navy"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-4 text-sm text-muted">
            Sube un Excel con hojas <strong>Proveedor 1</strong>, <strong>Proveedor 2</strong>,{" "}
            <strong>Proveedor 3</strong> y opcionalmente <strong>Enriquecido</strong>. Tras importar,
            los activos <strong>nuevos</strong> se enriquecen con la API del Catastro (referencia
            catastral) y mapa vía Geoapify si configuráis la clave en el servidor. Los duplicados por
            ID no se vuelven a añadir.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />

          {status === "idle" && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-cream/50 py-8 transition-colors hover:border-navy/30 hover:bg-cream"
            >
              <Upload size={24} className="text-muted" />
              <span className="text-sm font-medium text-navy">Seleccionar archivo .xlsx</span>
            </button>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 size={32} className="animate-spin text-gold" />
              <span className="text-center text-sm text-muted">{loadingHint || "Procesando…"}</span>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={40} className="text-green" />
              <p className="text-center text-sm font-medium text-navy">{message}</p>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy3"
              >
                Cerrar
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle size={40} className="text-red" />
              <p className="text-center text-sm text-red">{message}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStatus("idle"); setMessage(""); setLoadingHint(""); }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-navy hover:bg-cream"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy3"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
