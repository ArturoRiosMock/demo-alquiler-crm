import Link from "next/link";
import { Building2, Users, Handshake, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy to-navy3 p-8">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold3 text-sm font-bold text-navy">
          PC
        </div>
        <h1 className="text-4xl font-bold text-white">PropCRM</h1>
        <p className="mt-2 text-sm text-white/40">Real Estate Asset Management — Hybrid CRM + Public Portal</p>
        <p className="mt-1 text-xs text-white/20">NPL/REO · Gestión de carteras · Compradores y vendedores</p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-white shadow-lg shadow-gold/20 transition-all hover:bg-gold2 hover:shadow-gold/30">
            Panel Administrador <ArrowRight size={15} />
          </Link>
          <Link href="/portal" className="flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/5">
            Portal Público <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            ["6", "Activos", Building2],
            ["5", "Compradores", Users],
            ["5", "Vendedores", Handshake],
          ].map(([val, lbl, Icon]) => {
            const I = Icon as typeof Building2;
            return (
              <div key={lbl as string}>
                <I size={16} className="mx-auto mb-1 text-white/20" />
                <div className="text-xl font-bold text-gold">{val as string}</div>
                <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-white/30">{lbl as string}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
