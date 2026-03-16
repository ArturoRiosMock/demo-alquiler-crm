"use client";

import { use, useState } from "react";
import { useApp } from "@/lib/context";
import { fmt } from "@/lib/utils";
import { assetNotes, assetDocs, docNotes, adminNotes, chatMessages } from "@/lib/mock-data";
import Link from "next/link";
import type { Asset, NoteEntry, DocItem, ChatMessage } from "@/lib/types";
import { Home, FolderOpen, Briefcase, Users, Lock, ArrowLeft, Upload, Download, FileText, FileSpreadsheet, Image, MessageSquare, Send, Save, Plus, Mail } from "lucide-react";

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
  const asset = getAsset(id);
  const [tab, setTab] = useState(0);
  const [docSubTab, setDocSubTab] = useState(0);

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
            onClick={() => togglePub(asset.id)}
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
          {tab === 0 && <TabCaracteristicas asset={asset} />}
          {tab === 1 && <TabDocumentacion docSubTab={docSubTab} setDocSubTab={setDocSubTab} />}
          {tab === 2 && <TabAgentes asset={asset} />}
          {tab === 3 && <TabClientes />}
          {tab === 4 && <TabAdmin asset={asset} togglePub={() => togglePub(asset.id)} />}
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

function NoteCard({ note }: { note: NoteEntry }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-navy">{note.author}</span>
        <span className="text-[11px] text-muted">{note.date}</span>
      </div>
      <p className="text-sm leading-relaxed text-text">{note.text}</p>
    </div>
  );
}

function DocItemRow({ doc }: { doc: DocItem }) {
  const icons = { pdf: FileText, xls: FileSpreadsheet, img: Image };
  const colors = { pdf: "text-red", xls: "text-green", img: "text-blue" };
  const Icon = icons[doc.iconType];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-cream2 ${colors[doc.iconType]}`}><Icon size={16} /></div>
      <div className="flex-1">
        <div className="text-sm font-medium text-navy">{doc.name}</div>
        <div className="text-[11px] text-muted">{doc.meta}</div>
      </div>
      <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-cream"><Download size={12} /> Descargar</button>
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
function TabCaracteristicas({ asset }: { asset: Asset }) {
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
          <textarea className="w-full rounded-md border border-border bg-cream2 p-3 text-sm text-text outline-none focus:border-navy" rows={3} placeholder="Añade notas generales sobre el activo..." />
          <div className="mt-2 flex justify-end">
            <button className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2"><Save size={12} /> Guardar</button>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function TabDocumentacion({ docSubTab, setDocSubTab }: { docSubTab: number; setDocSubTab: (n: number) => void }) {
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
          <div className="mb-4 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-border bg-cream2 p-6 transition-all hover:border-navy/30">
            <Upload size={24} className="mb-2 text-muted" />
            <p className="text-sm text-muted"><span className="font-medium text-text">Arrastra archivos</span> o haz clic para seleccionar</p>
            <p className="mt-0.5 text-[11px] text-muted">PDF, Excel, imágenes — Máx. 50MB</p>
          </div>
          <div className="flex flex-col gap-2">{assetDocs.map((d, i) => <DocItemRow key={i} doc={d} />)}</div>
        </>
      )}
      {docSubTab === 1 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Notas y aclaraciones</p>
            <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-cream"><Plus size={12} /> Nueva nota</button>
          </div>
          <div className="flex flex-col gap-2">{docNotes.map((n, i) => <NoteCard key={i} note={n} />)}</div>
        </>
      )}
    </>
  );
}

function TabAgentes({ asset }: { asset: Asset }) {
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
        <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-cream"><Plus size={12} /> Añadir nota</button>
      </div>
      <div className="flex flex-col gap-2">{assetNotes.map((n, i) => <NoteCard key={i} note={n} />)}</div>
    </>
  );
}

function TabClientes() {
  const clients = [
    { id: "CLI-0041", name: "Juan Rodríguez García", ini: "JR", col: "#2563a8,#0d2a4a", tipo: "Privado", status: "Seguimiento", statusC: "text-blue", tel: "+34 612 345 678", email: "j.rodriguez@email.com", offer: "Oferta presentada: 95.000 € — 28 Feb 2026" },
    { id: "CLI-0038", name: "María Luisa Fernández Soto", ini: "ML", col: "#2a8c5e,#0d3a22", tipo: "Privado", status: "Contactada", statusC: "text-green", tel: "+34 698 765 432", email: "mluisa@empresa.es", offer: "Solicitud de información — 15 Feb 2026" },
  ];
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Clientes interesados</p>
        <button className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2"><Plus size={12} /> Añadir cliente</button>
      </div>
      {clients.map(cl => (
        <div key={cl.id} className="mb-3 rounded-lg border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(135deg,${cl.col})` }}>{cl.ini}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-navy">{cl.name}</div>
              <div className="text-[11px] text-muted">{cl.tipo} · NDA firmada · {cl.id}</div>
            </div>
            <span className={`rounded-md bg-cream px-2 py-0.5 text-[10px] font-semibold ${cl.statusC}`}>{cl.status}</span>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <DataPill label="Teléfono" value={cl.tel} />
            <DataPill label="Email" value={cl.email} />
            <DataPill label="Intereses" value="Residencial, Andalucía" />
          </div>
          <div className="flex items-center justify-between rounded-md bg-cream2 p-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Última actividad</div>
              <div className="text-sm text-text">{cl.offer}</div>
            </div>
            <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-white"><MessageSquare size={12} /> Chat</button>
          </div>
        </div>
      ))}
    </>
  );
}

function TabAdmin({ asset, togglePub }: { asset: Asset; togglePub: () => void }) {
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
          <textarea className="w-full rounded-md border border-border bg-cream2 p-3 text-sm text-text outline-none focus:border-navy" rows={3} defaultValue="Revisar situación judicial el 15/03. Hablar con el banco sobre cargas previas." />
          <div className="mt-2 flex justify-end gap-2">
            <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text hover:bg-cream"><Plus size={12} /> Nota</button>
            <button className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold2"><Save size={12} /> Guardar</button>
          </div>
          <div className="mt-3 flex flex-col gap-2">{adminNotes.map((n, i) => <NoteCard key={i} note={n} />)}</div>
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

import { Building } from "lucide-react";
