"use client";

import { useEffect, useRef, useState } from "react";
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

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "es-AR,es",
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

async function searchPlaces(query: string): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!res.ok) return "";
  const data = (await res.json()) as { display_name?: string };
  return String(data.display_name ?? "").trim();
}

export function LocationMapPicker({ value, onChange }: LocationMapPickerProps) {
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState(value.address);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapNodeRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;

      // Fix default marker icons in bundlers
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

      const map = L.map(mapNodeRef.current).setView([startLat, startLng], hasPoint ? 15 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const placeMarker = async (lat: number, lng: number, address?: string) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        map.setView([lat, lng], Math.max(map.getZoom(), 15));

        const resolved =
          address?.trim() ||
          (await reverseGeocode(lat, lng)) ||
          `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        onChangeRef.current({
          address: resolved,
          lat: String(lat),
          lng: String(lng),
        });
        setQuery(resolved);
        setStatus("Ubicación seleccionada");
      };

      if (hasPoint) {
        markerRef.current = L.marker([startLat, startLng]).addTo(map);
      }

      map.on("click", (event) => {
        void placeMarker(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;

      // Expose place helper for search selection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).__placeMarker = placeMarker;
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchPlaces(q);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function selectResult(item: NominatimResult) {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placeMarker = (mapRef.current as any)?.__placeMarker as
      | ((lat: number, lng: number, address?: string) => Promise<void>)
      | undefined;
    if (placeMarker) {
      await placeMarker(lat, lng, item.display_name);
    } else {
      onChange({
        address: item.display_name,
        lat: item.lat,
        lng: item.lon,
      });
    }
    setResults([]);
  }

  function clearLocation() {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    onChange({ address: "", lat: "", lng: "" });
    setQuery("");
    setStatus("");
    setResults([]);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4">
      <div>
        <p className="text-sm font-medium text-stone-800">Ubicación en el mapa</p>
        <p className="mt-1 text-xs text-stone-500">
          Buscá una dirección o hacé clic en el mapa para marcar el lugar.
        </p>
      </div>

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar dirección, salón, ciudad…"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          autoComplete="off"
        />
        {searching ? (
          <p className="mt-1 text-xs text-stone-500">Buscando…</p>
        ) : null}
        {results.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stone-200 bg-white shadow-lg">
            {results.map((item) => (
              <li key={`${item.lat}-${item.lon}-${item.display_name}`}>
                <button
                  type="button"
                  onClick={() => void selectResult(item)}
                  className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
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

      {status ? (
        <p className="text-xs text-green-800" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
