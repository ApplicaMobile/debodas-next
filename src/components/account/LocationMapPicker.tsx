"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LocationMapValue {
  address: string;
  lat: string;
  lng: string;
}

interface LocationMapPickerProps {
  value: LocationMapValue;
  onChange: (value: LocationMapValue) => void;
}

const DEFAULT_CENTER = { lat: -31.6333, lng: -60.7 }; // Santa Fe AR (fallback)

type GeocodeResult = {
  display_name: string;
  lat: string;
  lon: string;
};

async function searchPlaces(query: string): Promise<{
  results: GeocodeResult[];
  error?: string;
}> {
  const url = new URL("/api/geocode", window.location.origin);
  url.searchParams.set("q", query);
  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    results?: GeocodeResult[];
    error?: string;
  };
  if (!res.ok) {
    return { results: [], error: data.error ?? "No se pudo buscar." };
  }
  return { results: data.results ?? [] };
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL("/api/geocode", window.location.origin);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  const res = await fetch(url.toString());
  if (!res.ok) return "";
  const data = (await res.json()) as { address?: string };
  return String(data.address ?? "").trim();
}

export function LocationMapPicker({ value, onChange }: LocationMapPickerProps) {
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const placeMarkerRef = useRef<
    ((lat: number, lng: number, address?: string) => Promise<void>) | null
  >(null);
  const didAutoGeocodeRef = useRef(false);

  const [query, setQuery] = useState(value.address);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  const placeMarker = useCallback(
    async (lat: number, lng: number, address?: string) => {
      const map = mapRef.current;
      if (!map) return;

      const L = (await import("leaflet")).default;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      map.setView([lat, lng], 16);
      window.setTimeout(() => map.invalidateSize(), 50);

      const resolved =
        address?.trim() ||
        (await reverseGeocode(lat, lng)) ||
        value.address ||
        "Ubicación seleccionada";

      onChangeRef.current({
        address: resolved,
        lat: String(lat),
        lng: String(lng),
      });
      setQuery(resolved);
      setStatus("Ubicación seleccionada en el mapa");
      setError("");
      setResults([]);
    },
    [value.address],
  );

  useEffect(() => {
    placeMarkerRef.current = placeMarker;
  }, [placeMarker]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapNodeRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !mapNodeRef.current) return;

      const hasPoint = Boolean(value.lat && value.lng);
      const startLat = hasPoint ? Number(value.lat) : DEFAULT_CENTER.lat;
      const startLng = hasPoint ? Number(value.lng) : DEFAULT_CENTER.lng;

      const map = L.map(mapNodeRef.current, {
        scrollWheelZoom: false,
      }).setView([startLat, startLng], hasPoint ? 15 : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (hasPoint) {
        markerRef.current = L.marker([startLat, startLng]).addTo(map);
      }

      map.on("click", (event) => {
        void placeMarkerRef.current?.(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      window.setTimeout(() => {
        map.invalidateSize();
        if (!cancelled) setMapReady(true);
      }, 100);
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setMapReady(false);
    };
    // init once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si hay dirección guardada sin pin, geocodificar al estar listo el mapa
  useEffect(() => {
    if (!mapReady || didAutoGeocodeRef.current) return;
    if (value.lat && value.lng) return;
    const address = value.address.trim();
    if (address.length < 3) return;

    didAutoGeocodeRef.current = true;
    void (async () => {
      setSearching(true);
      setStatus("Ubicando dirección guardada…");
      try {
        const { results: found, error: searchError } =
          await searchPlaces(address);
        setResults(found);
        if (found.length === 0) {
          setError(
            searchError ||
              "No pudimos ubicar la dirección guardada. Buscá de nuevo o marcá en el mapa.",
          );
          setStatus("");
        } else {
          setStatus(
            found.length === 1
              ? "Encontramos 1 ubicación. Tocá el resultado para confirmarla en el mapa."
              : `Encontramos ${found.length} posibles ubicaciones. Elegí la correcta.`,
          );
        }
      } finally {
        setSearching(false);
      }
    })();
  }, [mapReady, value.address, value.lat, value.lng]);

  async function runSearch() {
    const q = query.trim();
    if (q.length < 3) {
      setError("Escribí al menos 3 caracteres para buscar.");
      setResults([]);
      return;
    }

    setSearching(true);
    setError("");
    setStatus("Buscando…");
    try {
      const { results: found, error: searchError } = await searchPlaces(q);
      setResults(found);
      if (found.length === 0) {
        setError(
          searchError ||
            "No encontramos esa dirección. Probá con calle, número y ciudad (ej: Maipú 1873, Santa Fe).",
        );
        setStatus("");
        return;
      }

      setStatus(
        found.length === 1
          ? "Encontramos 1 resultado. Tocá la lista para ubicarlo en el mapa."
          : `Encontramos ${found.length} resultados. Elegí el correcto de la lista (o marcá en el mapa).`,
      );
    } catch {
      setError("No se pudo buscar la dirección. Intentá de nuevo.");
      setStatus("");
    } finally {
      setSearching(false);
    }
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void runSearch();
    }
  }

  async function selectResult(item: GeocodeResult) {
    await placeMarkerRef.current?.(
      Number(item.lat),
      Number(item.lon),
      item.display_name,
    );
  }

  function clearLocation() {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    onChange({ address: "", lat: "", lng: "" });
    setQuery("");
    setStatus("");
    setError("");
    setResults([]);
    didAutoGeocodeRef.current = false;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4">
      <div>
        <p className="text-sm font-medium text-stone-800">
          Ubicación en el mapa
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Escribí calle, número y ciudad (ej: Maipú 1873, Santa Fe), tocá Buscar
          y elegí el resultado correcto. También podés marcar el punto con un
          clic en el mapa.
        </p>
      </div>

      <div className="relative space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError("");
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Ej: Maipú 1873, Santa Fe"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
            autoComplete="off"
          />
          <button
            type="button"
            disabled={searching}
            onClick={() => void runSearch()}
            className="rounded-full bg-[#06263a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {searching ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {results.length > 0 ? (
          <ul className="max-h-56 overflow-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            {results.map((item) => (
              <li key={`${item.lat}-${item.lon}-${item.display_name}`}>
                <button
                  type="button"
                  onClick={() => void selectResult(item)}
                  className="block w-full px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                >
                  {item.display_name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        ref={mapNodeRef}
        className="h-64 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
      />

      <input type="hidden" name="address" value={value.address} />
      <input type="hidden" name="lat" value={value.lat} />
      <input type="hidden" name="lng" value={value.lng} />

      {value.address ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm text-stone-700">
            <span className="font-medium">Dirección: </span>
            {value.address}
          </p>
          <button
            type="button"
            onClick={clearLocation}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Quitar ubicación
          </button>
        </div>
      ) : (
        <p className="text-xs text-stone-500">
          Todavía no hay un punto seleccionado.
        </p>
      )}

      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {status && !error ? (
        <p className="text-xs text-green-800" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
