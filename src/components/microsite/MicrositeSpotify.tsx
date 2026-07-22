interface MicrositeSpotifyProps {
  playlistId: string;
  titleClass?: string;
}

export function MicrositeSpotify({
  playlistId,
  titleClass,
}: MicrositeSpotifyProps) {
  const openUrl = `https://open.spotify.com/playlist/${playlistId}`;
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

  return (
    <div className="mx-auto max-w-3xl px-6 text-center">
      <h2 className={titleClass ?? "microsite-section__title theme-heading"}>
        ¿Qué canciones no pueden faltar?
      </h2>
      <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
        Sumá temas a nuestra playlist para bailar juntos.
      </p>
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="microsite-btn mt-6 inline-flex"
      >
        Agregar canciones
      </a>
      <div className="microsite-spotify__player mt-8">
        <iframe
          title="Playlist de Spotify"
          src={embedUrl}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="microsite-spotify__iframe"
        />
      </div>
    </div>
  );
}
