"use client";

import { useState, useRef } from "react";
import { useApp } from "@/lib/context";
import { parseExcelFile } from "@/lib/normalize-excel";
import { X, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UploadActivosModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadActivosModal({ open, onClose }: UploadActivosModalProps) {
  const { addAssets, assets: existing } = useApp();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
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
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        setStatus("error");
        setMessage("No se encontraron filas válidas en las hojas Proveedor 1, 2 o 3.");
        return;
      }
      const existingIds = new Set(existing.map(a => a.id));
      const newCount = parsed.filter(a => !existingIds.has(a.id)).length;
      const dupCount = parsed.length - newCount;
      addAssets(parsed);
      setStatus("success");
      setMessage(
        dupCount > 0
          ? `${newCount} activo(s) cargado(s). ${dupCount} duplicado(s) omitido(s).`
          : `${newCount} activo(s) cargado(s) correctamente.`
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Error al procesar el archivo.");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setMessage("");
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
            <strong>Proveedor 3</strong> y opcionalmente <strong>Enriquecido</strong>. Los datos
            se normalizarán y se añadirán al listado. Los activos con ID duplicado se omitirán.
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
              <span className="text-sm text-muted">Procesando Excel...</span>
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
                  onClick={() => { setStatus("idle"); setMessage(""); }}
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
