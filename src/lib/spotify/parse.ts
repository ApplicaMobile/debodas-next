/**
 * Extrae el ID de playlist de Spotify desde URL o ID crudo.
 * Acepta: "37i9dQZF...", "https://open.spotify.com/playlist/37i9dQZF...?si=..."
 */
export function parseSpotifyPlaylistId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const fromUrl = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/i.exec(value);
  if (fromUrl?.[1]) {
    return fromUrl[1];
  }

  if (/^[a-zA-Z0-9]{10,}$/.test(value)) {
    return value;
  }

  return null;
}

/** Lee spotify desde misc (compat Next `spotify_url` + WP `spotify`). */
export function getSpotifyPlaylistId(
  misc: Record<string, unknown> | null | undefined,
): string | null {
  if (!misc) return null;
  const raw = String(misc.spotify_url ?? misc.spotify ?? "").trim();
  return parseSpotifyPlaylistId(raw);
}
