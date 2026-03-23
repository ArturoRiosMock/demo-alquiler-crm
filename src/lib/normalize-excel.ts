import type { Asset, AssetAdmin } from "./types";
import * as XLSX from "xlsx";
import { defaultMapUrlForClient } from "./map-default";

function emptyAdm(): AssetAdmin {
  return {
    pip: "—", lin: "—", cat: "—", car: "—", cli: "—", id1: "—", con: "—", aid: "—", loans: "—",
    tcol: "—", scol: "—", ccaa: "—", prov: "—", city: "—", zip: "—", addr: "—", finca: "—", reg: "—",
    cref: "—", ejud: "—", ejmap: "—", eneg: "—", ob: "—", sub: "—", deu: "—", cprev: "—", cpost: "—",
    dtot: "—", pest: "—", str: "—", liq: "—", avj: "—", mmap: "—", buck: "—", lbuck: "—", smf: "—",
    rsub: "—", conn: "—", conn2: "—",
  };
}

function toNum(v: unknown): number | null {
  if (v == null || v === "" || v === "—") return null;
  if (typeof v === "number" && isFinite(v)) return v;
  if (v instanceof Date) return null;
  const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
  return isFinite(n) ? n : null;
}

function s(v: unknown): string {
  if (v == null || v === "") return "—";
  if (v instanceof Date) return "—";
  const str = String(v).trim();
  return str || "—";
}

function tipToTipC(tip: string): string {
  const t = tip.toUpperCase();
  if (t.includes("PARKING") || t.includes("GARAJE") || t.includes("GARAGE") || t.includes("PLAZA")) return "tp-park";
  if (t.includes("TRASTERO")) return "tp-tras";
  if (t.includes("LOCAL") || t.includes("COMERCIAL")) return "tp-local";
  return "tp-viv";
}

function faseToFaseC(fase: string): string {
  const f = fase.toUpperCase();
  if (f.includes("DEMANDA") || f.includes("SUBASTA") || f.includes("CONVOCAD") || f.includes("PUBLICAD")) return "fp-pub";
  if (f.includes("SUSPEND") || f.includes("PENDIENTE") || f.includes("NO JUDICIAL")) return "fp-sus";
  if (f.includes("SEGUIMIENTO")) return "fp-seg";
  if (f.includes("RESERV") || f.includes("NEGOCIACI")) return "fp-res";
  return "fp-nd";
}

/**
 * Proveedor 1 — columnas fijas:
 * 0=Data Ref, 1=Portfolio, 2=UF, 3=Main Local, 4=Lien, 5=ID Prinex, 6=ID Prinex Corto,
 * 7=CD Referencia Catastral, 8=Dirección Completa, 9=CP, 10=Municipio, 11=Provincia,
 * 12=CCAA, 13=Tipo Inmueble, 14=Juzgado, 15=Código Proc., 16=Última Fase, 17=Importe Reclamado, 18=Tasación
 */
function parseProveedor1(rows: unknown[][], defaultMap: string): Asset[] {
  const assets: Asset[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const id = s(row[2]);      // UF
    if (!id || id === "—") continue;
    const portfolio = s(row[1]);
    const catRef = s(row[7]);
    const fullAddr = s(row[8]);
    const cp = s(row[9]);
    const pob = s(row[10]);
    const prov = s(row[11]);
    const ccaa = s(row[12]);
    const tip = s(row[13]);
    const fase = s(row[16]);
    const precio = toNum(row[17]) ?? toNum(row[18]);

    const adm = emptyAdm();
    adm.car = portfolio;
    adm.aid = id;
    adm.cref = catRef;
    adm.addr = fullAddr;
    adm.prov = prov.toUpperCase();
    adm.city = pob;
    adm.zip = cp;
    adm.ccaa = ccaa.toUpperCase();
    adm.ejmap = fase;
    adm.deu = precio != null ? `${precio.toLocaleString("es-ES")} €` : "—";
    adm.dtot = adm.deu;

    assets.push({
      id, cat: "—",
      prov, pob, cp, addr: fullAddr,
      tip, tipC: tipToTipC(tip),
      fase, faseC: faseToFaseC(fase),
      precio, fav: false, chk: false, sqm: null,
      tvia: "—", nvia: "—", num: "—", esc: "—", pla: "—", pta: "—",
      map: defaultMap, catRef,
      clase: "—", uso: "—", bien: tip,
      supC: "—", supG: "—", coef: "—", ccaa,
      fullAddr, desc: fullAddr,
      ownerName: "—", ownerTel: "—", ownerMail: "—",
      adm, pub: false,
    });
  }
  return assets;
}

/**
 * Proveedor 2 — columnas fijas:
 * 0=ID PIPEDRIVE, 1=ID LINKEDIN, 2=CATEGORIA, 3=Cart., 4=CLIENTE, 5=Connection ID,
 * 6=Contract ID, 7=Asset ID, 8=Nº Loans, 9=Type of Collateral, 10=Subtype of Collateral,
 * 11=CCAA, 12=Asset Province, 13=Asset City, 14=ZIP Code, 15=Asset Address, 16=Nº Finca,
 * 17=Nº Registro, 18=Cadastral Reference, 19=Estado Judicial, 20=Estado Judicial Mapeo,
 * 21=Estado Negociación, 22=OB, 23=TIPO_SUBASTA, 24=DEU_TOT, 25=CARGAS PREVIAS,
 * 26=CARGAS POSTERIORES, 27=Connection Aux, 28=DEUDA TOTAL, 29=PRECIO ESTIMADO,
 * 30=MAIN STRATEGY, 31=LIQUIDEZ, 32=AVANCE JUDICIAL, 33=Mapeo Municipios,
 * 34=BUCKET LIQUIDEZ, 35=LOCALIZACIÓN BUCKETS, 36=STATUS MF, 37=Resultado Subasta,
 * 38=CONTACT - ASSET, 39=CONN - CONTRACT - ASSET
 */
function parseProveedor2(rows: unknown[][], defaultMap: string): Asset[] {
  const assets: Asset[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const id = s(row[7]);  // Asset ID
    if (!id || id === "—") continue;
    const cat = s(row[2]);
    const cartera = s(row[3]);
    const ccaa = s(row[11]);
    const prov = s(row[12]);
    const city = s(row[13]);
    const zip = s(row[14]);
    const addr = s(row[15]);
    const catRef = s(row[18]);
    const ejud = s(row[19]);
    const ejmap = s(row[20]);
    const eneg = s(row[21]);
    const ob = toNum(row[22]);
    const sub = s(row[23]);
    const deuTot = toNum(row[24]);
    const cprev = toNum(row[25]);
    const cpost = toNum(row[26]);
    const deudaTotal = toNum(row[28]);
    const precioEst = toNum(row[29]);
    const precio = precioEst ?? deudaTotal;
    const tcol = s(row[9]);
    const scol = s(row[10]);
    // Mapear subtype a tipología legible
    const tip = scol === "Flat" ? "Vivienda" : scol === "Terraced House" ? "Vivienda" : scol === "Garage" ? "Parking" : scol !== "—" ? scol : "Vivienda";

    const adm = emptyAdm();
    adm.pip = s(row[0]);
    adm.lin = s(row[1]);
    adm.cat = cat;
    adm.car = cartera;
    adm.cli = s(row[4]);
    adm.id1 = s(row[5]);
    adm.con = s(row[6]);
    adm.aid = id;
    adm.loans = s(row[8]);
    adm.tcol = tcol;
    adm.scol = scol;
    adm.ccaa = ccaa.toUpperCase();
    adm.prov = prov.toUpperCase();
    adm.city = city;
    adm.zip = zip;
    adm.addr = addr;
    adm.finca = s(row[16]);
    adm.reg = s(row[17]);
    adm.cref = catRef;
    adm.ejud = ejud;
    adm.ejmap = ejmap;
    adm.eneg = eneg;
    adm.ob = ob != null ? `${ob.toLocaleString("es-ES")} €` : "—";
    adm.sub = sub;
    adm.deu = deuTot != null ? `${deuTot.toLocaleString("es-ES")} €` : "—";
    adm.cprev = cprev != null ? `${cprev.toLocaleString("es-ES")} €` : "—";
    adm.cpost = cpost != null ? `${cpost.toLocaleString("es-ES")} €` : "—";
    adm.dtot = deudaTotal != null ? `${deudaTotal.toLocaleString("es-ES")} €` : "—";
    adm.pest = precioEst != null ? `${precioEst.toLocaleString("es-ES")} €` : "—";
    adm.str = s(row[30]);
    adm.liq = s(row[31]);
    adm.avj = s(row[32]);
    adm.mmap = s(row[33]);
    adm.buck = s(row[34]);
    adm.lbuck = s(row[35]);
    adm.smf = s(row[36]);
    adm.rsub = s(row[37]);
    adm.conn = s(row[38]);
    adm.conn2 = s(row[39]);

    assets.push({
      id, cat,
      prov, pob: city, cp: zip, addr,
      tip, tipC: tipToTipC(tip),
      fase: ejmap, faseC: faseToFaseC(ejmap),
      precio, fav: false, chk: false, sqm: null,
      tvia: "—", nvia: "—", num: "—", esc: "—", pla: "—", pta: "—",
      map: defaultMap, catRef,
      clase: "—", uso: tcol, bien: scol,
      supC: "—", supG: "—", coef: "—", ccaa,
      fullAddr: addr, desc: addr,
      ownerName: "—", ownerTel: "—", ownerMail: "—",
      adm, pub: false,
    });
  }
  return assets;
}

/**
 * Proveedor 3 — columnas fijas:
 * 0=Cartera, 1=NDG, 2=reference_code, 3=parcel, 4=property_type, 5=province,
 * 6=city, 7=ADRESS, 8=Nº, 9=ZIP, 10=SQM, 11=REFERENCIA CATASTRAL,
 * 12=GVB, 13=AUCTION BASE, 14=legaltype, 15=legalphase, 16=Nuevo, 17=ref cat
 */
function parseProveedor3(rows: unknown[][], defaultMap: string): Asset[] {
  const assets: Asset[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const id = s(row[1]);  // NDG
    if (!id || id === "—") continue;
    const cartera = s(row[0]);
    const propType = s(row[4]);
    const prov = s(row[5]);
    const city = s(row[6]);
    const adress = s(row[7]);
    const num = s(row[8]);
    const zip = s(row[9]);
    const sqm = toNum(row[10]);
    const catRef = s(row[11]) !== "—" ? s(row[11]) : s(row[17]);
    const gvb = toNum(row[12]);
    const legalphase = s(row[15]);

    const tip = propType.toLowerCase().includes("garaje") || propType.toLowerCase().includes("garage") || propType.toLowerCase().includes("plaza")
      ? "Parking"
      : "Vivienda";

    const numStr = num !== "—" ? ` ${num}` : "";
    const fullAddr = [adress + numStr, zip, city].filter(v => v && v !== "—").join(", ");

    const adm = emptyAdm();
    adm.car = cartera;
    adm.aid = id;
    adm.cref = catRef;
    adm.prov = prov.toUpperCase();
    adm.city = city;
    adm.zip = zip;
    adm.addr = adress + numStr;
    adm.deu = gvb != null ? `${gvb.toLocaleString("es-ES")} €` : "—";
    adm.dtot = adm.deu;
    adm.pest = adm.deu;
    adm.ejmap = legalphase;

    assets.push({
      id, cat: "—",
      prov, pob: city, cp: zip, addr: fullAddr,
      tip, tipC: tipToTipC(tip),
      fase: legalphase, faseC: faseToFaseC(legalphase),
      precio: gvb, fav: false, chk: false, sqm,
      tvia: "—", nvia: adress, num, esc: "—", pla: "—", pta: "—",
      map: defaultMap, catRef,
      clase: "—", uso: "—", bien: tip,
      supC: sqm != null ? `${sqm} m²` : "—",
      supG: "—", coef: "—", ccaa: "—",
      fullAddr, desc: fullAddr,
      ownerName: "—", ownerTel: "—", ownerMail: "—",
      adm, pub: false,
    });
  }
  return assets;
}

/**
 * Enriquecido — columnas fijas:
 * 0=Referencia, 1=Clase, 2=Uso, 3=Bien, 4=Provincia, 5=Municipio, 6=CP,
 * 7=Dirección Completa, 8=Tipo de Vía, 9=Nombre de Vía, 10=Número, 11=Escalera,
 * 12=Planta, 13=Puerta, 14=Sup. Construida, 15=Sup. Gráfica, 16=Longitud, 17=Latitud,
 * 18=Antigüedad, 19=Coeficiente, 20=Descripción Activo, 21=URL Imagen
 */
function parseEnriquecido(rows: unknown[][], defaultMap: string): Map<string, Partial<Asset>> {
  const geoKey = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GEOAPIFY_KEY?.trim() ?? "" : "";
  const byRef = new Map<string, Partial<Asset>>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const ref = s(row[0]);
    if (!ref || ref === "—") continue;
    const lat = s(row[17]);
    const lon = s(row[16]);
    const supC = toNum(row[14]);
    const supG = toNum(row[15]);
    const urlImg = s(row[21]);
    const mapUrl =
      urlImg !== "—" && urlImg.startsWith("http")
        ? urlImg
        : lat !== "—" && lon !== "—" && geoKey
          ? `https://maps.geoapify.com/v1/staticmap?center=lonlat:${lon},${lat}&zoom=15&width=600&height=400&style=osm-bright&apiKey=${encodeURIComponent(geoKey)}`
          : lat !== "—" && lon !== "—"
            ? `https://staticmap.openstreetmap.de/staticmap?center=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&zoom=15&size=600x400`
            : defaultMap;

    byRef.set(ref, {
      catRef: ref,
      clase: s(row[1]),
      uso: s(row[2]),
      bien: s(row[3]),
      prov: s(row[4]),
      pob: s(row[5]),
      cp: s(row[6]),
      fullAddr: s(row[7]),
      tvia: s(row[8]),
      nvia: s(row[9]),
      num: s(row[10]),
      esc: s(row[11]),
      pla: s(row[12]),
      pta: s(row[13]),
      supC: supC != null ? `${supC} m²` : "—",
      supG: supG != null ? `${supG} m²` : "—",
      sqm: supC,
      age: s(row[18]),
      coef: s(row[19]),
      desc: s(row[20]),
      map: mapUrl,
    });
  }
  return byRef;
}

function enrichAssets(assets: Asset[], enriquecido: Map<string, Partial<Asset>>): Asset[] {
  return assets.map(a => {
    const enr = enriquecido.get(a.catRef) ?? enriquecido.get(a.adm.cref);
    if (!enr) return a;
    return { ...a, ...enr, adm: { ...a.adm, cref: enr.catRef ?? a.adm.cref } } as Asset;
  });
}

function isEmptyAdmVal(v: string): boolean {
  return v === "—" || v === "" || v == null;
}

/** Une dos bloques adm: gana el valor “útil” de cualquiera de los dos (misma fila en varias hojas). */
function mergeAdmPreferNonEmpty(a: AssetAdmin, b: AssetAdmin): AssetAdmin {
  const keys = Object.keys(a) as (keyof AssetAdmin)[];
  const out = { ...a };
  for (const k of keys) {
    const av = String(a[k]);
    const bv = String(b[k]);
    if (!isEmptyAdmVal(bv)) out[k] = b[k];
    else if (!isEmptyAdmVal(av)) out[k] = a[k];
    else out[k] = "—";
  }
  return out;
}

/** Mismo activo (id) aparece en varias hojas: combinar sin perder CRM de Proveedor 2 ni datos de 1/3. */
function mergeAssetsSameId(prev: Asset, curr: Asset): Asset {
  const adm = mergeAdmPreferNonEmpty(prev.adm, curr.adm);
  const pickStr = (p: string, c: string) => (c && c !== "—" ? c : p && p !== "—" ? p : c || p || "—");
  return {
    ...prev,
    ...curr,
    cat: pickStr(prev.cat, curr.cat),
    prov: pickStr(prev.prov, curr.prov),
    pob: pickStr(prev.pob, curr.pob),
    cp: pickStr(prev.cp, curr.cp),
    addr: pickStr(prev.addr, curr.addr),
    tip: pickStr(prev.tip, curr.tip),
    fase: pickStr(prev.fase, curr.fase),
    tipC: curr.tip && curr.tip !== "—" ? curr.tipC : prev.tipC,
    faseC: curr.fase && curr.fase !== "—" ? curr.faseC : prev.faseC,
    precio: curr.precio != null ? curr.precio : prev.precio,
    sqm: curr.sqm != null ? curr.sqm : prev.sqm,
    catRef: pickStr(prev.catRef, curr.catRef),
    desc: pickStr(prev.desc, curr.desc),
    ccaa: pickStr(prev.ccaa, curr.ccaa),
    fullAddr: pickStr(prev.fullAddr, curr.fullAddr),
    map: curr.map && curr.map !== prev.map ? curr.map : prev.map || curr.map,
    adm,
  };
}

export function parseExcelFile(file: File): Promise<Asset[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = e.target?.result;
        if (!data) { reject(new Error("No se pudo leer el archivo")); return; }
        const wb = XLSX.read(data, { type: "binary", cellDates: true });
        const defaultMap = defaultMapUrlForClient();
        const all: Asset[] = [];
        let enriquecidoMap = new Map<string, Partial<Asset>>();

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
          if (rows.length < 2) continue;
          const name = sheetName.toUpperCase().replace(/\s+/g, " ").trim();
          if (name.includes("PROVEEDOR 1") || name.includes("PROVEEDOR1")) {
            all.push(...parseProveedor1(rows, defaultMap));
          } else if (name.includes("PROVEEDOR 2") || name.includes("PROVEEDOR2")) {
            all.push(...parseProveedor2(rows, defaultMap));
          } else if (name.includes("PROVEEDOR 3") || name.includes("PROVEEDOR3")) {
            all.push(...parseProveedor3(rows, defaultMap));
          } else if (name.includes("ENRIQUECIDO")) {
            enriquecidoMap = parseEnriquecido(rows, defaultMap);
          }
        }

        const enriched = enrichAssets(all, enriquecidoMap);

        // Un id puede salir en Proveedor 1 + 2 (o 3): fusionar adm y campos para no perder Pipedrive/CRM.
        const byId = new Map<string, Asset>();
        for (const a of enriched) {
          const prev = byId.get(a.id);
          if (!prev) byId.set(a.id, a);
          else byId.set(a.id, mergeAssetsSameId(prev, a));
        }
        resolve(Array.from(byId.values()));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Error al procesar el Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsBinaryString(file);
  });
}
