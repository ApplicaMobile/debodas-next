import { NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const USER_AGENT = "DeBodasWeb/1.0 (hola@debodas.com.ar)";

/** Bounding box aprox. Argentina (west,south,east,north). */
const AR_VIEWBOX = "-73.5,-55.1,-53.6,-21.8";

type NominatimSearchItem = {
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  importance?: number;
};

export type GeocodeResultItem = {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
};

type ParsedQuery = {
  free: string;
  street?: string;
  housenumber?: string;
  city?: string;
};

/**
 * Interpreta formatos AR típicos:
 * - "Maipú 1873, Santa Fe"
 * - "Maipu 1873 Santa Fe"
 * - "calle 123, Ciudad, Provincia"
 */
function parseArgentineAddress(q: string): ParsedQuery {
  const free = q.trim().replace(/\s+/g, " ");
  const parts = free
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let streetPart = parts[0] ?? free;
  const city =
    parts.length >= 2
      ? parts[1]
          .replace(/\b(argentina|provincia de)\b/gi, "")
          .trim()
      : undefined;

  // "Maipú 1873" o "1873 Maipú"
  const streetNumber = streetPart.match(
    /^(.+?)\s+(\d{1,6}[a-zA-Z]?)$/,
  );
  const numberStreet = streetPart.match(
    /^(\d{1,6}[a-zA-Z]?)\s+(.+)$/,
  );

  let street: string | undefined;
  let housenumber: string | undefined;

  if (streetNumber) {
    street = streetNumber[1].trim();
    housenumber = streetNumber[2].trim();
  } else if (numberStreet) {
    housenumber = numberStreet[1].trim();
    street = numberStreet[2].trim();
  } else {
    street = streetPart;
  }

  return { free, street, housenumber, city };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreResult(
  item: NominatimSearchItem,
  parsed: ParsedQuery,
): number {
  const name = normalizeText(item.display_name ?? "");
  let score = Number(item.importance ?? 0) * 10;

  if (parsed.city) {
    const city = normalizeText(parsed.city);
    if (name.includes(city)) score += 40;
    // Prefer capital Santa Fe over "Esperanza, ... Santa Fe" when user said Santa Fe
    if (
      city.includes("santa fe") &&
      name.includes("santa fe de la vera cruz")
    ) {
      score += 35;
    }
    if (
      city.includes("santa fe") &&
      !city.includes("esperanza") &&
      name.includes("esperanza")
    ) {
      score -= 45;
    }
    // Ciudad pedida más cerca del inicio del display_name suele ser más precisa
    const cityIndex = name.indexOf(city);
    if (cityIndex >= 0 && cityIndex < 80) score += 10;
  }

  if (parsed.street) {
    const street = normalizeText(parsed.street);
    if (name.includes(street)) score += 20;
  }

  if (parsed.housenumber) {
    const num = normalizeText(parsed.housenumber);
    if (name.includes(num)) score += 15;
    // house/building preferred over generic street
    if (item.type === "house" || item.class === "building") score += 20;
    if (item.type === "residential" || item.type === "yes") score += 5;
  }

  return score;
}

async function nominatimSearch(
  params: Record<string, string>,
): Promise<NominatimSearchItem[]> {
  const url = new URL(`${NOMINATIM}/search`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("countrycodes", "ar");
  url.searchParams.set("limit", "10");
  url.searchParams.set("viewbox", AR_VIEWBOX);
  url.searchParams.set("bounded", "0");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es-AR,es",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return [];
  }

  return (await res.json()) as NominatimSearchItem[];
}

function toResults(
  data: NominatimSearchItem[],
  parsed: ParsedQuery,
): GeocodeResultItem[] {
  const ranked = [...data]
    .filter((item) => item.lat && item.lon && item.display_name)
    .map((item) => ({
      item,
      score: scoreResult(item, parsed),
    }))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: GeocodeResultItem[] = [];

  for (const { item } of ranked) {
    const key = `${item.lat}|${item.lon}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      display_name: String(item.display_name),
      lat: String(item.lat),
      lon: String(item.lon),
      type: String(item.type ?? item.class ?? ""),
    });
    if (results.length >= 8) break;
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const lat = String(searchParams.get("lat") ?? "").trim();
  const lng = String(searchParams.get("lng") ?? "").trim();

  if (lat && lng) {
    try {
      const url = new URL(`${NOMINATIM}/reverse`);
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lng);
      url.searchParams.set("format", "json");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "Accept-Language": "es-AR,es",
          "User-Agent": USER_AGENT,
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "No se pudo resolver la dirección." },
          { status: 502 },
        );
      }

      const data = (await res.json()) as { display_name?: string };
      return NextResponse.json({
        address: String(data.display_name ?? "").trim(),
      });
    } catch (err) {
      console.error("[geocode reverse]", err);
      return NextResponse.json(
        { error: "Error al consultar el mapa." },
        { status: 500 },
      );
    }
  }

  if (q.length < 3) {
    return NextResponse.json(
      { error: "Escribí al menos 3 caracteres.", results: [] },
      { status: 400 },
    );
  }

  try {
    const parsed = parseArgentineAddress(q);
    let data: NominatimSearchItem[] = [];

    // 1) Structured search cuando hay calle + número
    if (parsed.street && parsed.housenumber) {
      const streetParam = `${parsed.housenumber} ${parsed.street}`;
      data = await nominatimSearch({
        street: streetParam,
        ...(parsed.city ? { city: parsed.city } : {}),
        country: "Argentina",
      });
    }

    // 2) Fallback free-form
    if (data.length === 0) {
      data = await nominatimSearch({ q: parsed.free });
    }

    // 3) Si hay ciudad y pocos resultados, reintentar free-form con ciudad reforzada
    if (data.length < 2 && parsed.city && parsed.street) {
      const reinforced = `${parsed.street} ${parsed.housenumber ?? ""}, ${parsed.city}, Argentina`
        .replace(/\s+/g, " ")
        .trim();
      const extra = await nominatimSearch({ q: reinforced });
      data = [...data, ...extra];
    }

    const results = toResults(data, parsed);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[geocode search]", err);
    return NextResponse.json(
      { error: "Error al consultar el mapa.", results: [] },
      { status: 500 },
    );
  }
}
