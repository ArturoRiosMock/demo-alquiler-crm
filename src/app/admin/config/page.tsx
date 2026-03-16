"use client";

import { useState } from "react";
import { Save, Plus, Pencil } from "lucide-react";

interface ToggleItem { label: string; desc: string; enabled: boolean; }

export default function ConfigPage() {
  const [general, setGeneral] = useState<ToggleItem[]>([
    { label: "Portal público activo", desc: "Permite el acceso público al portal de propiedades", enabled: true },
    { label: "Registro de compradores", desc: "Permite que nuevos compradores se registren", enabled: true },
    { label: "Notificaciones por email", desc: "Enviar alertas automáticas al equipo", enabled: false },
    { label: "Modo mantenimiento", desc: "Desactiva temporalmente el portal público", enabled: false },
  ]);

  const [nda, setNda] = useState<ToggleItem[]>([
    { label: "NDA obligatoria", desc: "Requiere firma de NDA para ver datos sensibles", enabled: true },
    { label: "Firma electrónica", desc: "Permitir firma digital de NDA", enabled: true },
    { label: "Caducidad automática", desc: "NDA expira a los 12 meses", enabled: false },
  ]);

  const [pubConf, setPubConf] = useState<ToggleItem[]>([
    { label: "Mostrar precios", desc: "Los precios son visibles en el portal público", enabled: false },
    { label: "Mostrar dirección exacta", desc: "Solo muestra municipio si está desactivado", enabled: false },
    { label: "Formulario de contacto", desc: "Habilita el formulario para cada activo público", enabled: true },
  ]);

  const toggle = (list: ToggleItem[], setList: (v: ToggleItem[]) => void, i: number) => {
    const copy = [...list];
    copy[i] = { ...copy[i], enabled: !copy[i].enabled };
    setList(copy);
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white px-6">
        <h1 className="text-lg font-semibold text-navy">Configuración</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">Admin</span>
          <button className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-medium text-white hover:bg-navy3"><Save size={14} /> Guardar todo</button>
        </div>
      </div>

      <div className="p-5">
        <p className="mb-4 text-xs text-muted">Ajustes generales del CRM y portal público</p>

        <div className="flex flex-col gap-4">
          <SettingsSection title="General" items={general} onToggle={(i) => toggle(general, setGeneral, i)} />
          <SettingsSection title="NDA y Privacidad" items={nda} onToggle={(i) => toggle(nda, setNda, i)} />
          <SettingsSection title="Portal Público" items={pubConf} onToggle={(i) => toggle(pubConf, setPubConf, i)} />

          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold after:h-px after:flex-1 after:bg-border">Carteras Activas</div>
            <div className="flex flex-wrap gap-2">
              {["ALOE", "OMEGA", "HERCULES", "ROCK"].map(c => (
                <div key={c} className="flex items-center gap-2 rounded-md border border-border bg-cream2 px-3.5 py-2">
                  <span className="text-sm font-semibold text-navy">{c}</span>
                  <span className="rounded bg-green/8 px-1.5 py-0.5 text-[10px] font-semibold text-green">Activa</span>
                </div>
              ))}
              <button className="flex items-center gap-1 rounded-md border-2 border-dashed border-border px-3.5 py-2 text-xs font-medium text-muted hover:border-navy/30 hover:text-navy"><Plus size={12} /> Añadir cartera</button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold after:h-px after:flex-1 after:bg-border">Equipo / Agentes</div>
            <div className="flex flex-col gap-2">
              {[
                { name: "Carlos Martínez", role: "Agente Principal", ini: "CM", col: "#2563a8,#0d2a4a" },
                { name: "Ana López", role: "Agente", ini: "AL", col: "#2a8c5e,#0d3a22" },
                { name: "Administrador", role: "Admin", ini: "AD", col: "#b8933a,#0d1b2a" },
              ].map(ag => (
                <div key={ag.name} className="flex items-center gap-3 rounded-md border border-border bg-cream2 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: `linear-gradient(135deg,${ag.col})` }}>{ag.ini}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-navy">{ag.name}</div>
                    <div className="text-[11px] text-muted">{ag.role}</div>
                  </div>
                  <button className="flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-xs text-muted hover:text-navy"><Pencil size={11} /> Editar</button>
                </div>
              ))}
              <button className="flex items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border p-3 text-xs font-medium text-muted hover:border-navy/30 hover:text-navy"><Plus size={13} /> Añadir agente</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsSection({ title, items, onToggle }: { title: string; items: ToggleItem[]; onToggle: (i: number) => void }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold after:h-px after:flex-1 after:bg-border">{title}</div>
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-border bg-cream2 p-3">
            <div>
              <div className="text-sm font-medium text-navy">{item.label}</div>
              <div className="text-xs text-muted">{item.desc}</div>
            </div>
            <div
              className={`relative h-5 w-10 cursor-pointer rounded-full transition-colors ${item.enabled ? "bg-green" : "bg-border"}`}
              onClick={() => onToggle(i)}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${item.enabled ? "left-[22px]" : "left-0.5"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
