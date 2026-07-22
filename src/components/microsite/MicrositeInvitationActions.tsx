import type { DigitalInvitation } from "@/lib/invitations/types";
import {
  buildGoogleCalendarUrl,
  buildMapsEmbedUrl,
  buildMapsSearchUrl,
  formatInvitationDateParts,
} from "@/lib/invitations/format";

interface MicrositeInvitationActionsProps {
  invitations: DigitalInvitation[];
  coupleName: string;
  isPremium: boolean;
  hashtag?: string;
}

export function MicrositeInvitationActions({
  invitations,
  coupleName,
  isPremium,
  hashtag,
}: MicrositeInvitationActionsProps) {
  const visible = invitations.filter((item) => item.isVisibleInMicrosite);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 text-center">
      {visible.map((invitation) => {
        const { dateLabel, timeLabel } = formatInvitationDateParts(
          invitation.datetime,
        );
        const locationParts = [
          invitation.locationName,
          isPremium ? invitation.location.address : "",
        ].filter(Boolean);
        const locationText = locationParts.join(", ");
        const calendarUrl = buildGoogleCalendarUrl({
          title: `Boda ${coupleName}`,
          datetime: invitation.datetime,
          location: locationText,
          details: hashtag ? `#${hashtag}` : "BODA",
        });
        const mapsQuery =
          isPremium && invitation.location.address
            ? invitation.location.address
            : invitation.locationName;
        const mapEmbedUrl =
          isPremium && mapsQuery
            ? buildMapsEmbedUrl({
                lat: invitation.location.lat,
                lng: invitation.location.lng,
                query: mapsQuery,
              })
            : null;

        return (
          <div
            key={invitation.id}
            className="microsite-card microsite-invitation-actions"
          >
            {invitation.title ? (
              <h3 className="theme-heading text-2xl sm:text-3xl">
                {invitation.title}
              </h3>
            ) : null}
            {invitation.locationName ? (
              <p className="mt-3 text-base">{invitation.locationName}</p>
            ) : null}
            {isPremium && invitation.location.address ? (
              <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
                {invitation.location.address}
              </p>
            ) : null}
            {dateLabel || timeLabel ? (
              <p className="mt-2 text-sm">
                {[dateLabel, timeLabel].filter(Boolean).join(" · ")}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {calendarUrl ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="microsite-invitation-actions__btn"
                >
                  Agendar
                </a>
              ) : null}
              {isPremium && mapsQuery ? (
                <a
                  href={buildMapsSearchUrl(mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="microsite-invitation-actions__btn"
                >
                  Ir al lugar
                </a>
              ) : null}
            </div>

            {mapEmbedUrl ? (
              <div className="microsite-invitation-actions__map">
                <iframe
                  title={`Mapa ${invitation.name || invitation.title || "evento"}`}
                  src={mapEmbedUrl}
                  className="h-[300px] w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
