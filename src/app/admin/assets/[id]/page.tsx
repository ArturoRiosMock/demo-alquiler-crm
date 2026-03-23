"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/lib/context";
import { fmt } from "@/lib/utils";
import { assetNotes, assetDocs, docNotes, adminNotes, chatMessages } from "@/lib/mock-data";
import Link from "next/link";
import type { Asset, NoteEntry, DocItem, ChatMessage } from "@/lib/types";
import { Home, FolderOpen, Briefcase, Users, Lock, ArrowLeft, Upload, Download, FileText, FileSpreadsheet, Image, MessageSquare, Send, Save, Plus, Mail, X, Loader2, AlertCircle, CheckCircle2, Building } from "lucide-react";
import { uploadDocumento, fetchDocumentos, deleteDocumento, getDocumentUrl, type DocRow } from "@/app/actions/documentos";
import { createNota, fetchNotas, type NotaRow } from "@/app/actions/notas";
import { fetchCompradores } from "@/app/actions/compradores";
import { fetchAssetById, toggleAssetPub } from "@/app/actions/assets";
import type { Comprador } from "@/lib/types";

const tabs = [
  { icon: Home, label: "Características" },
  { icon: FolderOpen, label: "Documentación" },
  { icon: Briefcase, label: "Agentes" },
  { icon: Users, label: "Clientes" },
  { icon: Lock, label: "Administrador" },
];

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getAsset, togglePub } = useApp();
  const ctxAsset = getAsset(id);
  const [remoteAsset, setRemoteAsset] = useState<Asset | null | undefined>(undefined);
  const [tab, setTab] = useState(0);
  const [docSubTab, setDocSubTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ nombre: string; email: string } | null>(null);

  const loadRemote = useCallback(() => {
    fetchAssetById(id)
      .then((a) => setRemoteAsset(a))
      .catch(() => setRemoteAsset(null));
  }, [id]);

  useEffect(() => {
    setRemoteAsset(undefined);
    loadRemote();
  }, [id, loadRemote]);

  useEffect(() => {
    const onMerged = () => {
      setRemoteAsset(undefined);
      loadRemote();
    };
    window.addEventListener("propcrm-assets-updated", onMerged);
    return () => window.removeEventListener("propcrm-assets-updated", onMerged);
  }, [loadRemote]);

  useEffect(() => {
    const cookie = document.cookie.split("; ").find(c => c.startsWith("dev-auth="));
    if (cookie) {
      try {
        const data = JSON.parse(decodeURIComponent(cookie.split("=")[1]));
        setCurrentUser({ nombre: data.nombre || "Admin", email: data.email || "admin@propcrm.com" });
      } catch {
        setCurrentUser({ nombre: "Admin", email: "admin@propcrm.com" });
      }
    } else {
      setCurrentUser({ nombre: "Admin", email: "admin@propcrm.com" });
    }
  }, []);

  const asset =
    remoteAsset !== undefined
      ? remoteAsset ?? ctxAsset
      : ctxAsset;

  const handleTogglePub = async () => {
    if (!asset) return;
    try {
      await toggleAssetPub(asset.id);
      togglePub(asset.id);
      loadRemote();
    } catch {
      /* mantener solo toggle local si falla BD */
      togglePub(asset.id);
    }
  };

  if (!asset) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
      <Building size={40} strokeWidth={1} className="text-border" />
      <p className="text-base font-medium">Activo no encontrado</p>
      <Link href="/admin" className="text-sm text-gold hover:underline">Volver</Link>
    </div>
  );

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-navy">{asset.pob}, {asset.prov}</h1>
          <span className="rounded-md bg-cream px-2.5 py-0.5 text-xs text-muted">{asset.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">Admin</span>
          <Link href="/admin" className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-medium text-navy transition-colors hover:bg-cream">
            <ArrowLeft size={14} /> Volver
          </Link>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="flex h-11 items-center gap-3 border-b border-border bg-white px-5">
        {asset.cat !== "—" && <span className="rounded-md bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">{asset.cat}</span>}
        <span className="flex-1 truncate text-sm text-navy">{asset.addr}</span>
        <div className="flex items-center gap-2">
          <div
            className={`relative h-5 w-10 cursor-pointer rounded-full transition-colors ${asset.pub ? "bg-green" : "bg-navy3"}`}
            onClick={() => void handleTogglePub()}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${asset.pub ? "left-[22px]" : "left-0.5"}`} />
          </div>
          <span className={`text-xs font-semibold ${asset.pub ? "text-green" : "text-red"}`}>{asset.pub ? "Publicado" : "Suspendido"}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 102px)" }}>
        {/* Left nav */}
        <div className="flex w-44 min-w-[176px] flex-col bg-navy py-3">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            return (
              <button
                key={i}
                onClick={() => setTab(i)}
                className={`flex items-center gap-2.5 border-l-[3px] px-4 py-2.5 text-left transition-all ${
                  tab === i ? "border-l-gold bg-white/[0.06] text-gold" : "border-l-transparent text-white/35 hover:bg-white/[0.03] hover:text-white/60"
                } ${i === 4 ? "mt-auto border-t border-t-white/[0.06] pt-3" : ""}`}
              >
                <Icon size={15} strokeWidth={1.5} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-cream p-6">
          {tab === 0 && <TabCaracteristicas asset={asset} assetId={id} currentUser={currentUser} />}
          {tab === 1 && <TabDocumentacion assetId={id} docSubTab={docSubTab} setDocSubTab={setDocSubTab} currentUser={currentUser} />}
          {tab === 2 && <TabAgentes asset={asset} assetId={id} currentUser={currentUser} />}
          {tab === 3 && <TabClientes assetId={id} />}
          {tab === 4 && <TabAdmin asset={asset} assetId={id} togglePub={() => void handleTogglePub()} currentUser={currentUser} />}
        </div>
      </div>
    </>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold after:h-px after:flex-1 after:bg-border">{title}</div>
      {children}
    </div>
  );
}

function DataPill({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md bg-cream2 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`text-sm leading-snug ${mono ? "font-mono text-xs text-muted" : "text-text"}`}>{value}</div>
    </div>
  );
}

function NoteCard({ note }: { note: NoteEntry | NotaRow }) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  };
  const date = "date" in note ? note.date : formatDate(note.created_at);
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-navy">{note.author}</span>
        <span className="text-[11px] text-muted">{date}</span>
      </div>
      <p className="text-sm leading-relaxed text-text">{note.text}</p>
    </div>
  );
}

function DocItemRow({ doc, onDelete }: { doc: DocRow; onDelete?: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const icons: Record<string, typeof FileText> = { pdf: FileText, xls: FileSpreadsheet, img: Image, zip: FileText, other: FileText };
  const colors: Record<string, string> = { pdf: "text-red", xls: "text-green", img: "text-blue", zip: "text-orange", other: "text-muted" };
  const Icon = icons[doc.icon_type] || FileText;
  const color = colors[doc.icon_type] || "text-muted";

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getDocumentUrl(doc.storage_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Error al descargar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-cream2 ${color}`}><Icon size={16} /></div>
      <div className="flex-1">
        <div className="text-sm font-medium text-navy">{doc.name}</div>
        <div className="text-[11px] text-muted">{doc.uploaded_by} · {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-cream disabled:opacity-50"
        >
          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Descargar
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-md border border-red/20 px-2.5 py-1.5 text-xs font-medium text-red hover:bg-red/5"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`max-w-[76%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
      msg.from === "cli" ? "self-start bg-cream2 text-text" : "self-end bg-navy text-white"
    }`}>
      {msg.text}
      <div className={`mt-0.5 text-[10px] ${msg.from === "cli" ? "text-muted" : "text-right text-white/40"}`}>{msg.time}</div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
function TabCaracteristicas({ asset, assetId, currentUser }: { asset: Asset; assetId: string; currentUser: { nombre: string; email: string } | null }) {
  const [generalNote, setGeneralNote] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <>
      <div className="mb-4 grid grid-cols-[1fr_260px] gap-4">
        <div className="flex flex-col gap-3">
          <SectionCard title="Datos Catastrales">
            <div className="grid grid-cols-4 gap-2">
              <DataPill label="Referencia" value={asset.catRef} mono />
              <DataPill label="Clase" value={asset.clase} />
              <DataPill label="Uso" value={asset.uso} />
              <DataPill label="Bien" value={asset.bien} />
              <DataPill label="Sup. Construida" value={asset.supC} />
              <DataPill label="Sup. Gráfica" value={asset.supG} />
              <DataPill label="Antigüedad" value={asset.age || "—"} />
              <DataPill label="Coef. Part." value={asset.coef} />
            </div>
          </SectionCard>
          <SectionCard title="Localización">
            <div className="mb-2 grid grid-cols-3 gap-2">
              <DataPill label="Tipo de Vía" value={asset.tvia} />
              <DataPill label="Nombre de Vía" value={asset.nvia} />
              <DataPill label="Número" value={asset.num} />
              <DataPill label="Escalera" value={asset.esc} />
              <DataPill label="Planta" value={asset.pla} />
              <DataPill label="Puerta" value={asset.pta} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <DataPill label="Municipio" value={asset.pob} />
              <DataPill label="Provincia" value={asset.prov} />
              <DataPill label="C.P." value={asset.cp} />
              <DataPill label="CCAA" value={asset.ccaa} />
              <div className="col-span-4"><DataPill label="Dirección Completa" value={asset.fullAddr} /></div>
            </div>
          </SectionCard>
        </div>
        <div className="flex flex-col gap-3">
          <img src={asset.map} alt="Mapa" className="h-[260px] w-[260px] rounded-lg border border-border object-cover" />
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-navy">{fmt(asset.precio)}</div>
            <div className="mb-4 text-[11px] text-muted">Precio estimado</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-xs font-medium text-navy hover:bg-cream"><MessageSquare size={13} /> Consultar</button>
              <button className="flex items-center justify-center gap-1.5 rounded-lg bg-gold py-2.5 text-xs font-medium text-white hover:bg-gold2"><FileText size={13} /> Oferta</button>
            </div>
          </div>
        </div>
      </div>
      <SectionCard title="Descripción del Activo">
        <p className="text-sm leading-[1.7] text-text">{asset.desc}</p>
      </SectionCard>
      <div className="mt-3">
        <SectionCard title="Notas del activo">
          <textarea
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            className="w-full rounded-md border border-border bg-cream2 p-3 text-sm text-text outline-none focus:border-navy"
            rows={3}
            placeholder="Añade notas generales sobre el activo..."
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={async () => {
                if (!generalNote.trim() || !currentUser) return;
                setSaving(true);
                try {
                  await createNota({
                    assetId,
                    author: currentUser.nombre,
                    text: generalNote.trim(),
                  });
                  setGeneralNote("");
                  alert("Nota guardada correctamente");
                } catch (err) {
                  alert("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!generalNote.trim() || saving}
              className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function TabDocumentacion({ assetId, docSubTab, setDocSubTab, currentUser }: { assetId: string; docSubTab: number; setDocSubTab: (n: number) => void; currentUser: { nombre: string; email: string } | null }) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [notes, setNotes] = useState<NotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    loadData();
  }, [assetId, docSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (docSubTab === 0) {
        const fetched = await fetchDocumentos({ assetId });
        setDocs(fetched);
      } else {
        const fetched = await fetchNotas({ assetId });
        setNotes(fetched);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("El archivo excede el tamaño máximo de 50MB");
      return;
    }
    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("asset_id", assetId);
      formData.append("uploaded_by", currentUser?.nombre || "Admin");
      await uploadDocumento(formData);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await deleteDocumento(docId);
      await loadData();
    } catch (err) {
      alert("Error al eliminar: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !currentUser) return;
    setSavingNote(true);
    try {
      await createNota({
        assetId,
        author: currentUser.nombre,
        text: noteText.trim(),
      });
      setNoteText("");
      setShowNoteForm(false);
      await loadData();
    } catch (err) {
      alert("Error al guardar nota: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingNote(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <>
      <div className="mb-4 flex gap-0 border-b border-border">
        {[["Documentos", FileText], ["Notas", MessageSquare]].map(([lbl, Icon], i) => {
          const I = Icon as typeof FileText;
          return (
            <button key={i} onClick={() => setDocSubTab(i)} className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-medium transition-all ${docSubTab === i ? "border-b-navy text-navy" : "border-b-transparent text-muted"}`}>
              <I size={13} /> {lbl as string}
            </button>
          );
        })}
      </div>
      {docSubTab === 0 && (
        <>
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mb-4 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed bg-cream2 p-6 transition-all ${
              dragging ? "border-navy bg-gold/5" : uploading ? "border-gold bg-gold/5" : "border-border hover:border-navy/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            {uploading ? (
              <>
                <Loader2 size={24} className="mb-2 animate-spin text-gold" />
                <p className="text-sm font-medium text-text">Subiendo archivo...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="mb-2 text-muted" />
                <p className="text-sm text-muted"><span className="font-medium text-text">Arrastra archivos</span> o haz clic para seleccionar</p>
                <p className="mt-0.5 text-[11px] text-muted">PDF, Excel, imágenes — Máx. 50MB</p>
              </>
            )}
          </div>
          {uploadError && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red/10 px-3 py-2 text-xs text-red">
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-green/10 px-3 py-2 text-xs text-green">
              <CheckCircle2 size={14} /> Archivo subido correctamente
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gold" />
            </div>
          ) : docs.length === 0 ? (
            <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted">
              No hay documentos subidos aún
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((d) => (
                <DocItemRow key={d.id} doc={d} onDelete={() => handleDeleteDoc(d.id)} />
              ))}
            </div>
          )}
        </>
      )}
      {docSubTab === 1 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Notas y aclaraciones</p>
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-cream"
            >
              <Plus size={12} /> Nueva nota
            </button>
          </div>
          {showNoteForm && (
            <div className="mb-3 rounded-lg border border-border bg-white p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="mb-2 w-full rounded-md border border-border bg-cream2 p-3 text-sm text-text outline-none focus:border-navy"
                rows={3}
                placeholder="Escribe tu nota aquí..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowNoteForm(false); setNoteText(""); }}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim() || savingNote}
                  className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2 disabled:opacity-50"
                >
                  {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gold" />
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted">
              No hay notas aún
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function TabAgentes({ asset, assetId, currentUser }: { asset: Asset; assetId: string; currentUser: { nombre: string; email: string } | null }) {
  const [notes, setNotes] = useState<NotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [assetId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const fetched = await fetchNotas({ assetId });
      setNotes(fetched);
    } catch (err) {
      console.error("Error cargando notas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !currentUser) return;
    setSavingNote(true);
    try {
      await createNota({
        assetId,
        author: currentUser.nombre,
        text: noteText.trim(),
      });
      setNoteText("");
      setShowNoteForm(false);
      await loadNotes();
    } catch (err) {
      alert("Error al guardar nota: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <>
      <div className="mb-4 rounded-lg bg-gradient-to-br from-navy to-navy3 p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Resumen del Activo</div>
        <div className="grid grid-cols-3 gap-3">
          {[["Categoría", asset.cat], ["Fase Judicial", asset.adm.ejmap || "—"], ["Deuda / Precio", asset.adm.deu || "—"]].map(([l, v]) => (
            <div key={l}><div className="text-[10px] font-medium uppercase tracking-wider text-muted">{l}</div><div className="text-sm text-white/80">{v}</div></div>
          ))}
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Notas del agente</p>
        <button
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-cream"
        >
          <Plus size={12} /> Añadir nota
        </button>
      </div>
      {showNoteForm && (
        <div className="mb-3 rounded-lg border border-border bg-white p-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="mb-2 w-full rounded-md border border-border bg-cream2 p-3 text-sm text-text outline-none focus:border-navy"
            rows={3}
            placeholder="Escribe tu nota aquí..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowNoteForm(false); setNoteText(""); }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-cream"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveNote}
              disabled={!noteText.trim() || savingNote}
              className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2 disabled:opacity-50"
            >
              {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted">
          No hay notas del agente aún
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </>
  );
}

function TabClientes({ assetId }: { assetId: string }) {
  const { compradores } = useApp();
  const [loading, setLoading] = useState(false);
  const [clientNotes, setClientNotes] = useState<Record<string, NotaRow[]>>({});

  useEffect(() => {
    loadClientNotes();
  }, [compradores, assetId]);

  const loadClientNotes = async () => {
    setLoading(true);
    try {
      const notesMap: Record<string, NotaRow[]> = {};
      for (const comp of compradores) {
        const notes = await fetchNotas({ compradorId: comp.id });
        notesMap[comp.id] = notes;
      }
      setClientNotes(notesMap);
    } catch (err) {
      console.error("Error cargando notas de clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const getClientStatus = (comp: Comprador): { label: string; color: string } => {
    if (comp.nda === "Firmada") {
      if (comp.estado.includes("Seguimiento") || comp.estado.includes("Interesado")) {
        return { label: "Seguimiento", color: "text-blue" };
      }
      return { label: "Contactada", color: "text-green" };
    }
    return { label: "Nueva", color: "text-muted" };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorGradient = (ini: string) => {
    const colors = ["#2563a8,#0d2a4a", "#2a8c5e,#0d3a22", "#b8933a,#7a5f26", "#c0392b,#7a1f15", "#d4762a,#8a4e1a"];
    const idx = ini.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  if (compradores.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted">
        No hay clientes registrados aún
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Clientes interesados</p>
        <Link
          href="/admin/compradores"
          className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2"
        >
          <Plus size={12} /> Gestionar clientes
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        compradores.map((cl) => {
          const status = getClientStatus(cl);
          const ini = getInitials(cl.nombre);
          const col = getColorGradient(ini);
          const notes = clientNotes[cl.id] || [];
          return (
            <div key={cl.id} className="mb-3 rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(135deg,${col})` }}>
                  {ini}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-navy">{cl.nombre}</div>
                  <div className="text-[11px] text-muted">{cl.tipo} · NDA {cl.nda.toLowerCase()} · {cl.id}</div>
                </div>
                <span className={`rounded-md bg-cream px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>{status.label}</span>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <DataPill label="Teléfono" value={cl.tel || "—"} />
                <DataPill label="Email" value={cl.email || "—"} />
                <DataPill label="Intereses" value={cl.intereses || "—"} />
              </div>
              {notes.length > 0 && (
                <div className="mb-3 rounded-md bg-cream2 p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Últimas notas</div>
                  <div className="flex flex-col gap-2">
                    {notes.slice(0, 2).map((n) => (
                      <div key={n.id} className="text-xs text-text">
                        <span className="font-medium">{n.author}:</span> {n.text.length > 80 ? n.text.slice(0, 80) + "..." : n.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between rounded-md bg-cream2 p-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Estado</div>
                  <div className="text-sm text-text">{cl.estado}</div>
                </div>
                <Link
                  href={`/admin/compradores/${cl.id}`}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-white"
                >
                  <MessageSquare size={12} /> Ver perfil
                </Link>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function TabAdmin({ asset, assetId, togglePub, currentUser }: { asset: Asset; assetId: string; togglePub: () => void; currentUser: { nombre: string; email: string } | null }) {
  const [adminNote, setAdminNote] = useState("Revisar situación judicial el 15/03. Hablar con el banco sobre cargas previas.");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<NotaRow[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    loadAdminNotes();
  }, [assetId]);

  const loadAdminNotes = async () => {
    setLoadingNotes(true);
    try {
      const fetched = await fetchNotas({ assetId });
      setNotes(fetched.filter(n => n.author === "Admin" || n.author === (currentUser?.nombre || "Admin")));
    } catch (err) {
      console.error("Error cargando notas admin:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSaveAdminNote = async () => {
    if (!adminNote.trim() || !currentUser) return;
    setSaving(true);
    try {
      await createNota({
        assetId,
        author: currentUser.nombre,
        text: adminNote.trim(),
      });
      setAdminNote("");
      await loadAdminNotes();
    } catch (err) {
      alert("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };
  const d = asset.adm;
  const allFields: [string, string][] = [
    ["ID Pipedrive",d.pip],["ID LinkedIn",d.lin],["Categoría",d.cat],["Cartera",d.car],["Cliente",d.cli],["ID1",d.id1],["Contract ID",d.con],["Asset ID",d.aid],["Nº Loans",d.loans],["Type of Collateral",d.tcol],["Subtype Collateral",d.scol],["CCAA",d.ccaa],["Provincia",d.prov],["Municipio",d.city],["ZIP Code",d.zip],["Nº Finca",d.finca],["Nº Registro",d.reg],["Ref. Catastral",d.cref],["Estado Judicial",d.ejud],["Estado Jud. Mapeo",d.ejmap],["Estado Negociación",d.eneg],["OB",d.ob],["Tipo Subasta",d.sub],["DEU_TOT",d.deu],["Cargas Previas",d.cprev],["Cargas Post.",d.cpost],["Deuda Total",d.dtot],["Precio Estimado",d.pest],["Main Strategy",d.str],["Liquidez",d.liq],["Avance Judicial",d.avj],["Mapeo Municipios",d.mmap],["Bucket Liquidez",d.buck],["Localiz. Buckets",d.lbuck],["Status MF",d.smf],["Resultado Subasta",d.rsub],
  ];

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <SectionCard title="Estado de publicación">
          <div className="mb-3 flex items-center gap-2.5">
            <div className={`relative h-5 w-10 cursor-pointer rounded-full transition-colors ${asset.pub ? "bg-green" : "bg-navy3"}`} onClick={togglePub}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${asset.pub ? "left-[22px]" : "left-0.5"}`} />
            </div>
            <span className={`text-xs font-semibold ${asset.pub ? "text-green" : "text-red"}`}>{asset.pub ? "Publicado" : "Suspendido"}</span>
          </div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Fase interna</p>
          <select className="w-full cursor-pointer appearance-none rounded-md border border-border bg-cream2 px-3 py-2 text-xs text-text outline-none focus:border-navy">
            <option>Seguimiento</option><option>Info. Solicitada</option><option>Reservado</option><option>No Disponible</option>
          </select>
        </SectionCard>
        <SectionCard title="Propietario / Vendedor">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <DataPill label="Nombre" value={asset.ownerName} />
            <DataPill label="Teléfono" value={asset.ownerTel} />
            <div className="col-span-2"><DataPill label="Email" value={asset.ownerMail} /></div>
          </div>
          <button className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gold py-2 text-xs font-medium text-white hover:bg-gold2"><Mail size={13} /> Enviar correo</button>
        </SectionCard>
      </div>

      <div className="mb-4">
        <SectionCard title="Datos Completos del Proveedor">
          <div className="grid grid-cols-4 gap-2">
            {allFields.map(([l, v]) => <DataPill key={l} label={l} value={v || "—"} mono={["ID1","Contract ID","ZIP Code","Ref. Catastral"].includes(l)} />)}
            <div className="col-span-2"><DataPill label="Asset Address" value={d.addr || "—"} mono /></div>
            <div className="col-span-2"><DataPill label="Conn — Contract — Asset" value={d.conn2 || "—"} mono /></div>
          </div>
        </SectionCard>
      </div>

      <div className="mb-4">
        <SectionCard title="Notas privadas">
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="w-full rounded-md border border-border bg-cream2 p-3 text-sm text-text outline-none focus:border-navy"
            rows={3}
            placeholder="Notas privadas del administrador..."
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setAdminNote("")}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-cream"
            >
              <X size={12} /> Limpiar
            </button>
            <button
              onClick={handleSaveAdminNote}
              disabled={!adminNote.trim() || saving}
              className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
          {loadingNotes ? (
            <div className="mt-3 flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gold" />
            </div>
          ) : notes.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {notes.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Chat */}
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-navy"><MessageSquare size={13} /> Conversaciones</div>
          <span className="text-[11px] text-muted">3 activas</span>
        </div>
        <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto p-3.5">
          {chatMessages.map((m, i) => <ChatBubble key={i} msg={m} />)}
        </div>
        <div className="flex gap-2 border-t border-border p-3">
          <textarea className="flex-1 rounded-md border border-border p-2 text-sm outline-none focus:border-navy" rows={1} placeholder="Escribe una respuesta..." />
          <button className="flex items-center gap-1 rounded-md bg-gold px-3 py-2 text-xs font-medium text-white hover:bg-gold2"><Send size={12} /></button>
        </div>
      </div>
    </>
  );
}

