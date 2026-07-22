"use client";

import { useEffect } from "react";
import {
  formatInvitationDateParts,
  outfitLabel,
} from "@/lib/invitations/format";
import { getInvitationTheme, INVITATION_FONTS_HREF } from "@/lib/invitations/themes";
import type { DigitalInvitation } from "@/lib/invitations/types";
import "@/styles/invitation-cards.css";

interface InvitationCardPreviewProps {
  invitation: Pick<
    DigitalInvitation,
    | "theme"
    | "title"
    | "description"
    | "datetime"
    | "outfit"
    | "locationName"
    | "location"
  >;
  brideName: string;
  groomName: string;
  showAddress?: boolean;
  cardId?: string;
  className?: string;
}

export function InvitationCardPreview({
  invitation,
  brideName,
  groomName,
  showAddress = false,
  cardId,
  className = "",
}: InvitationCardPreviewProps) {
  const theme = getInvitationTheme(invitation.theme);
  const isRsvp = theme?.isRsvp ?? false;
  const { dateLabel, timeLabel } = formatInvitationDateParts(
    invitation.datetime,
  );

  useEffect(() => {
    const id = "invitation-card-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = INVITATION_FONTS_HREF;
    document.head.appendChild(link);
  }, []);

  if (!theme) {
    return null;
  }

  return (
    <div className={`invitation-card-stage ${className}`.trim()}>
      <div
        id={cardId}
        className={`invitation-card-body ${theme.slug}`}
        style={{ backgroundImage: `url(${theme.backgroundSrc})` }}
      >
        {isRsvp ? <p className="rsvp">RSVP</p> : null}

        <h4>
          {brideName}
          {theme.stackNames ? <br /> : " "}
          <span>&</span>
          {theme.stackNames ? <br /> : " "}
          {groomName}
        </h4>

        {!isRsvp ? (
          <>
            {invitation.title ? (
              <p className="title">{invitation.title}</p>
            ) : null}
            {invitation.description &&
            invitation.description.trim().toLowerCase() !==
              invitation.title.trim().toLowerCase() ? (
              <p className="description">{invitation.description}</p>
            ) : null}
          </>
        ) : null}

        {dateLabel ? <p className="date">{dateLabel}</p> : null}
        {timeLabel ? <p className="time">{timeLabel}</p> : null}
        {invitation.locationName ? (
          <p className="location-name">{invitation.locationName}</p>
        ) : null}

        {!isRsvp ? (
          <>
            {showAddress && invitation.location.address ? (
              <p className="address">{invitation.location.address}</p>
            ) : null}
            <p className="outfit">
              Vestimenta {outfitLabel(invitation.outfit)}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
