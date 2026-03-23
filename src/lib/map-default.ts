/**
 * Mapa por defecto cuando no hay API key de Geoapify (cliente Excel u offline).
 * OpenStreetMap static (sin clave).
 */
export const OSM_FALLBACK_MAP =
  "https://staticmap.openstreetmap.de/staticmap?center=40.4168,-3.7038&zoom=6&size=600x400";

/**
 * URL por defecto en importación Excel (bundle cliente: NEXT_PUBLIC_GEOAPIFY_KEY opcional).
 */
export function defaultMapUrlForClient(): string {
  const k =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GEOAPIFY_KEY?.trim() ?? "" : "";
  if (k) {
    return `https://maps.geoapify.com/v1/staticmap?center=lonlat:-3.7038,40.4168&zoom=6&width=600&height=400&style=osm-bright&apiKey=${encodeURIComponent(k)}`;
  }
  return OSM_FALLBACK_MAP;
}
