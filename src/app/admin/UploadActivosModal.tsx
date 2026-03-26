"use client";

import { useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/context";
import { parseExcelFile, extractRawPreview, parseWithMapping } from "@/lib/normalize-excel";
import { enrichAssetsWithCatastro } from "@/app/actions/catastro";
import { upsertAssets } from "@/app/actions/assets";
import { validateAndEnrichWithClaude } from "@/app/actions/claude";
import { detectFormatWithClaude } from "@/app/actions/claude-format-detect";
import type { ClaudeAssetResult } from "@/app/actions/claude";
import {
  X, Upload, Loader2, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Sparkles, FileSpreadsheet,
  Brain, MapPin, Database, Clock,
} from "lucide-react";

interface UploadActivosModalProps {
  open: boolean;
  onClose: () => void;
}

type StepId = "parse" | "ai-detect" | "ai-validate" | "catastro" | "db";
type StepStatus = "pending" | "active" | "done" | "error" | "skipped";

interface PipelineStep {
  id: StepId;
  label: string;
  detail: string;
  status: StepStatus;
  elapsed?: number;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: "parse", label: "Lectura Excel", detail: "Leyendo hojas y normalizando columnas…", status: "pending" },
  { id: "ai-detect", label: "Detección IA", detail: "Identificando formato con Claude…", status: "pending" },
  { id: "ai-validate", label: "Validación IA", detail: "Clasificando y validando activos…", status: "pending" },
  { id: "catastro", label: "Catastro", detail: "Enriqueciendo con datos del Catastro…", status: "pending" },
  { id: "db", label: "Base de datos", detail: "Guardando en Supabase…", status: "pending" },
];

const STEP_ICONS: Record<StepId, React.ReactNode> = {
  "parse": <FileSpreadsheet size={15} />,
  "ai-detect": <Brain size={15} />,
  "ai-validate": <Sparkles size={15} />,
  "catastro": <MapPin size={15} />,
  "db": <Database size={15} />,
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function UploadActivosModal({ open, onClose }: UploadActivosModalProps) {
  const { addAssets, assets: existing } = useApp();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [parsedCount, setParsedCount] = useState(0);
  const [aiSummary, setAiSummary] = useState("");
  const [aiWarnings, setAiWarnings] = useState<ClaudeAssetResult[]>([]);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateStep = useCallback((id: StepId, patch: Partial<PipelineStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

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
    setAiSummary("");
    setAiWarnings([]);
    setParsedCount(0);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: "pending", elapsed: undefined })));

    try {
      // Step 1: Parse Excel
      const t0 = Date.now();
      updateStep("parse", { status: "active", detail: `Leyendo ${file.name}…` });
      let parsed = await parseExcelFile(file);
      updateStep("parse", {
        status: "done",
        detail: parsed.length > 0
          ? `${parsed.length} activo(s) encontrado(s) en el Excel`
          : "Sin formato reconocido",
        elapsed: Date.now() - t0,
      });

      // Step 2: AI Format Detection (only if parse returned 0)
      if (parsed.length === 0) {
        const t1 = Date.now();
        updateStep("ai-detect", { status: "active", detail: "Enviando cabeceras a Claude para identificar columnas…" });
        try {
          const preview = await extractRawPreview(file);
          const detection = await detectFormatWithClaude(preview);

          if (detection.confidence > 0.5 && Object.keys(detection.mapping).length > 0) {
            updateStep("ai-detect", {
              status: "active",
              detail: `Formato detectado (${detection.description}, ${Math.round(detection.confidence * 100)}% confianza). Parseando…`,
            });
            parsed = await parseWithMapping(file, detection.mapping);
            if (parsed.length === 0) {
              updateStep("ai-detect", { status: "error", detail: "Formato detectado pero sin filas válidas", elapsed: Date.now() - t1 });
              setStatus("error");
              setMessage(`La IA identificó el formato (${detection.description}) pero no se pudieron extraer filas válidas.`);
              return;
            }
            updateStep("ai-detect", {
              status: "done",
              detail: `${parsed.length} activo(s) extraídos con formato "${detection.description}"`,
              elapsed: Date.now() - t1,
            });
          } else {
            updateStep("ai-detect", { status: "error", detail: "No se pudo detectar el formato", elapsed: Date.now() - t1 });
            setStatus("error");
            setMessage("No se encontraron filas válidas. La IA tampoco pudo detectar el formato del Excel.");
            return;
          }
        } catch {
          updateStep("ai-detect", { status: "error", detail: "Error de conexión con IA", elapsed: Date.now() - t1 });
          setStatus("error");
          setMessage("No se encontraron filas válidas. La detección automática con IA falló.");
          return;
        }
      } else {
        updateStep("ai-detect", { status: "skipped", detail: "Formato reconocido — no necesario" });
      }

      setParsedCount(parsed.length);

      // Step 3: AI Validation
      const t2 = Date.now();
      updateStep("ai-validate", {
        status: "active",
        detail: `Enviando ${parsed.length} activo(s) a Claude para validar y clasificar…`,
      });
      try {
        const claudeResult = await validateAndEnrichWithClaude(parsed);
        parsed = claudeResult.assets;
        setAiSummary(claudeResult.result.summary);

        const withWarnings = claudeResult.result.assets.filter((a) => a.warnings.length > 0);
        if (withWarnings.length > 0) setAiWarnings(withWarnings);

        const corrected = claudeResult.result.assets.filter(a =>
          a.tip || a.tipC || a.fase || a.faseC || a.prov || a.cp
        ).length;

        updateStep("ai-validate", {
          status: "done",
          detail: corrected > 0
            ? `${corrected} corrección(es), ${withWarnings.length} advertencia(s)`
            : withWarnings.length > 0
              ? `${withWarnings.length} advertencia(s) detectada(s)`
              : "Todos los activos validados correctamente",
          elapsed: Date.now() - t2,
        });
      } catch {
        updateStep("ai-validate", {
          status: "error",
          detail: "Error de conexión — datos importados sin validar",
          elapsed: Date.now() - t2,
        });
        setAiSummary("Validación IA omitida (error de conexión).");
      }

      // Step 4: Catastro
      const existingIds = new Set(existing.map((a) => a.id));
      const toAdd = parsed.filter((a) => !existingIds.has(a.id));
      const toUpdate = parsed.filter((a) => existingIds.has(a.id));

      let enrichedNew: typeof parsed = [];
      const parts: string[] = [];

      if (toAdd.length > 0) {
        const t3 = Date.now();
        updateStep("catastro", {
          status: "active",
          detail: `Consultando Catastro y geocodificación para ${toAdd.length} activo(s) nuevo(s)…`,
        });
        const { assets, ok, skipped, failed, supabase } = await enrichAssetsWithCatastro(toAdd);
        enrichedNew = assets;
        parts.push(`${toAdd.length} nuevo(s): ${ok} ficha(s) completada(s) con datos del Catastro.`);
        if (skipped > 0) parts.push(`${skipped} sin referencia catastral válida.`);
        if (failed.length > 0) {
          parts.push(`${failed.length} error(es) Catastro.`);
        }
        if (supabase.attempted) {
          if (supabase.errors.length) {
            parts.push(`Supabase: ${supabase.errors.join("; ")}`);
          } else {
            parts.push(`Guardado en BD: ${supabase.inserted} alta(s), ${supabase.updated} actualización(es).`);
          }
        }
        updateStep("catastro", {
          status: failed.length > 0 ? "done" : "done",
          detail: `${ok} enriquecido(s), ${skipped} omitido(s), ${failed.length} error(es)`,
          elapsed: Date.now() - t3,
        });
      } else {
        updateStep("catastro", { status: "skipped", detail: "Todos los activos ya existen" });
      }

      if (toUpdate.length > 0) {
        parts.push(`${toUpdate.length} activo(s) existente(s) actualizado(s).`);
      }

      // Step 5: Database
      const mergedForUi = [...enrichedNew, ...toUpdate];
      addAssets(mergedForUi);

      if (mergedForUi.length > 0) {
        const t4 = Date.now();
        updateStep("db", {
          status: "active",
          detail: `Guardando ${mergedForUi.length} activo(s) en Supabase…`,
        });
        try {
          const db = await upsertAssets(mergedForUi);
          if (db.errors.length > 0) {
            parts.push(`Sincronización BD: ${db.errors.slice(0, 2).join("; ")}`);
            updateStep("db", { status: "error", detail: db.errors[0], elapsed: Date.now() - t4 });
          } else {
            updateStep("db", {
              status: "done",
              detail: `${mergedForUi.length} activo(s) guardado(s) correctamente`,
              elapsed: Date.now() - t4,
            });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "error desconocido";
          parts.push(`No se guardó en BD: ${msg}`);
          updateStep("db", { status: "error", detail: msg, elapsed: Date.now() - t4 });
        }
      } else {
        updateStep("db", { status: "skipped", detail: "Sin activos que guardar" });
      }

      setMessage(parts.length > 0 ? parts.join(" ") : "No se procesaron filas.");

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
    setAiSummary("");
    setAiWarnings([]);
    setWarningsOpen(false);
    setParsedCount(0);
    setSteps(INITIAL_STEPS);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!open) return null;

  const activeStep = steps.find(s => s.status === "active");
  const doneSteps = steps.filter(s => s.status === "done").length;
  const totalRelevant = steps.filter(s => s.status !== "skipped" && s.status !== "pending").length || 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-white shadow-xl"
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
          {status === "idle" && (
            <>
              <p className="mb-4 text-sm text-muted">
                Sube un Excel con hojas <strong>Proveedor 1</strong>, <strong>Proveedor 2</strong>,{" "}
                <strong>Proveedor 3</strong> y opcionalmente <strong>Enriquecido</strong>. Si el formato
                no se reconoce, la IA intentará detectarlo automáticamente.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFile}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-cream/50 py-8 transition-colors hover:border-navy/30 hover:bg-cream"
              >
                <Upload size={24} className="text-muted" />
                <span className="text-sm font-medium text-navy">Seleccionar archivo .xlsx</span>
              </button>
            </>
          )}

          {status === "loading" && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(5, (doneSteps / Math.max(totalRelevant, steps.filter(s => s.status !== "pending").length || 5)) * 100)}%` }}
                  />
                </div>
                {parsedCount > 0 && (
                  <span className="shrink-0 text-xs font-medium text-muted">{parsedCount} activos</span>
                )}
              </div>

              {/* Pipeline steps */}
              <div className="space-y-1">
                {steps.map((step) => {
                  if (step.status === "pending") return null;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-2.5 rounded-lg px-3 py-2 transition-all duration-300 ${
                        step.status === "active"
                          ? "bg-blue-50 ring-1 ring-blue-200"
                          : step.status === "error"
                            ? "bg-red-50"
                            : step.status === "skipped"
                              ? "bg-gray-50 opacity-50"
                              : "bg-green-50/60"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 shrink-0 ${
                        step.status === "active"
                          ? "text-blue-500"
                          : step.status === "done"
                            ? "text-green-500"
                            : step.status === "error"
                              ? "text-red-400"
                              : "text-gray-400"
                      }`}>
                        {step.status === "active"
                          ? <Loader2 size={15} className="animate-spin" />
                          : step.status === "done"
                            ? <CheckCircle size={15} />
                            : step.status === "error"
                              ? <AlertCircle size={15} />
                              : STEP_ICONS[step.id]
                        }
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${
                            step.status === "active" ? "text-blue-700"
                              : step.status === "done" ? "text-green-700"
                                : step.status === "error" ? "text-red-600"
                                  : "text-gray-500"
                          }`}>
                            {step.label}
                          </span>
                          {step.elapsed != null && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Clock size={9} />
                              {formatMs(step.elapsed)}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-tight ${
                          step.status === "active" ? "text-blue-600"
                            : step.status === "error" ? "text-red-500"
                              : "text-gray-500"
                        }`}>
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active step highlight */}
              {activeStep && (
                <p className="text-center text-xs text-muted">
                  {activeStep.id === "ai-validate" && parsedCount > 20
                    ? `Procesando en lotes de 20… (${Math.ceil(parsedCount / 20)} lotes)`
                    : "Esto puede tardar unos segundos…"}
                </p>
              )}
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3">
              {/* Completed pipeline */}
              <div className="space-y-1">
                {steps.map((step) => {
                  if (step.status === "pending") return null;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-2.5 rounded-lg px-3 py-1.5 ${
                        step.status === "error" ? "bg-red-50" : step.status === "skipped" ? "bg-gray-50 opacity-50" : "bg-green-50/60"
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 ${
                        step.status === "done" ? "text-green-500" : step.status === "error" ? "text-red-400" : "text-gray-400"
                      }`}>
                        {step.status === "done"
                          ? <CheckCircle size={14} />
                          : step.status === "error"
                            ? <AlertCircle size={14} />
                            : STEP_ICONS[step.id]
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-semibold ${
                            step.status === "done" ? "text-green-700" : step.status === "error" ? "text-red-600" : "text-gray-500"
                          }`}>
                            {step.label}
                          </span>
                          {step.elapsed != null && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Clock size={8} />
                              {formatMs(step.elapsed)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-tight text-gray-500">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary message */}
              <div className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                <p className="text-xs font-medium text-green-800">{message}</p>
              </div>

              {/* AI Summary */}
              {aiSummary && (
                <div className="flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2.5">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                  <p className="text-[11px] text-indigo-700">{aiSummary}</p>
                </div>
              )}

              {/* AI Warnings (collapsible) */}
              {aiWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50">
                  <button
                    type="button"
                    onClick={() => setWarningsOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left"
                  >
                    <span className="text-xs font-medium text-amber-700">
                      {aiWarnings.length} activo(s) con advertencias IA
                    </span>
                    {warningsOpen
                      ? <ChevronUp size={14} className="text-amber-500" />
                      : <ChevronDown size={14} className="text-amber-500" />
                    }
                  </button>
                  {warningsOpen && (
                    <div className="max-h-40 overflow-y-auto border-t border-amber-200 px-3 py-2">
                      {aiWarnings.map((w) => (
                        <div key={w.id} className="mb-1.5 last:mb-0">
                          <span className="text-xs font-semibold text-amber-800">ID {w.id}:</span>
                          <ul className="ml-3 list-disc">
                            {w.warnings.map((msg, i) => (
                              <li key={i} className="text-xs text-amber-700">{msg}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="mx-auto block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy3"
              >
                Cerrar
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              {/* Show completed steps before error */}
              {steps.some(s => s.status !== "pending") && (
                <div className="space-y-1">
                  {steps.map((step) => {
                    if (step.status === "pending") return null;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-2.5 rounded-lg px-3 py-1.5 ${
                          step.status === "error" ? "bg-red-50" : step.status === "skipped" ? "bg-gray-50 opacity-50" : "bg-green-50/60"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${
                          step.status === "done" ? "text-green-500" : step.status === "error" ? "text-red-400" : "text-gray-400"
                        }`}>
                          {step.status === "done"
                            ? <CheckCircle size={14} />
                            : step.status === "error"
                              ? <AlertCircle size={14} />
                              : STEP_ICONS[step.id]
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[11px] font-semibold ${
                            step.status === "done" ? "text-green-700" : step.status === "error" ? "text-red-600" : "text-gray-500"
                          }`}>
                            {step.label}
                          </span>
                          <p className="text-[11px] leading-tight text-gray-500">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-xs text-red-600">{message}</p>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                    setAiSummary("");
                    setAiWarnings([]);
                    setParsedCount(0);
                    setSteps(INITIAL_STEPS);
                  }}
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
