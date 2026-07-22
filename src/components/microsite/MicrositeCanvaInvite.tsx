import { MicrositeSectionTitle } from "@/components/themes/ThemeSection";
import { toCanvaEmbedUrl } from "@/lib/invitations/parse";

interface MicrositeCanvaInviteProps {
  canvaLink: string;
  titleClass: string;
}

export function MicrositeCanvaInvite({
  canvaLink,
  titleClass,
}: MicrositeCanvaInviteProps) {
  const embedUrl = toCanvaEmbedUrl(canvaLink);
  if (!embedUrl) {
    return null;
  }

  return (
    <div className="mx-auto max-w-xl px-6 text-center">
      <MicrositeSectionTitle className={titleClass}>
        Invitación
      </MicrositeSectionTitle>
      <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
        Diseño personalizado de los novios
      </p>
      <div className="microsite-card mt-6 overflow-hidden p-0">
        <iframe
          title="Invitación en Canva"
          src={embedUrl}
          className="h-[560px] w-full border-0 sm:h-[620px]"
          loading="lazy"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
      <a
        href={canvaLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex text-sm font-semibold underline"
      >
        Abrir en Canva ↗
      </a>
    </div>
  );
}
