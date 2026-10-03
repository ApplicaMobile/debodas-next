"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { IllustrationBell } from "@/components/account/AccountIllustrations";
import {
  AccountItemList,
  AccountListItem,
  AccountSection,
} from "@/components/account/AccountPage";
import { Badge, Button } from "@/components/ui";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import {
  formatNotificationRelative,
  notificationTypeLabel,
} from "@/lib/notifications/format";
import type { PanelNotificationItem } from "@/lib/notifications/queries";

interface NotificationsHistoryPanelProps {
  items: PanelNotificationItem[];
  unreadCount: number;
}

export function NotificationsHistoryPanel({
  items: initialItems,
  unreadCount: initialUnreadCount,
}: NotificationsHistoryPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [pending, startTransition] = useTransition();

  function markAll() {
    setItems((prev) =>
      prev.map((item) =>
        item.readAt ? item : { ...item, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function openItem(item: PanelNotificationItem) {
    if (!item.readAt) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, readAt: new Date().toISOString() }
            : row,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    startTransition(async () => {
      if (!item.readAt) {
        await markNotificationReadAction(item.id);
      }
      router.push(item.href);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <AccountSection id="notificaciones-historial" title="Historial">
        <AccountEmptyState
          illustration={IllustrationBell}
          title="Todavía no hay notificaciones"
          description="Cuando alguien confirme asistencia o envíe un regalo, vas a ver el historial acá."
          actions={[
            {
              label: "Compartir / invitar",
              href: "/mi-cuenta/invitar",
              primary: true,
            },
            { label: "Ver invitados", href: "/mi-cuenta/invitados" },
          ]}
        />
      </AccountSection>
    );
  }

  return (
    <AccountSection
      id="notificaciones-historial"
      title="Historial"
      description={`${items.length} avisos. Abrí uno para ver el detalle; se marca como leído.`}
      badge={
        unreadCount > 0 ? (
          <Badge tone="info">{unreadCount} sin leer</Badge>
        ) : (
          <Badge tone="aprobado">Al día</Badge>
        )
      }
      actions={
        unreadCount > 0 ? (
          <Button
            type="button"
            variant="secundario"
            size="sm"
            disabled={pending}
            onClick={markAll}
          >
            Marcar todas como leídas
          </Button>
        ) : null
      }
    >
      <AccountItemList label="Notificaciones">
        {items.map((item) => {
          const unread = !item.readAt;
          return (
            <AccountListItem
              key={item.id}
              onSelect={() => openItem(item)}
              highlighted={unread}
              leading={
                <Badge tone="neutro" icon={false}>
                  {notificationTypeLabel(item.type)}
                </Badge>
              }
              title={item.title}
              meta={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span>{formatNotificationRelative(item.createdAt)}</span>
                  {unread ? (
                    <Badge tone="info" icon={false}>
                      Nueva
                    </Badge>
                  ) : null}
                  <span className="sr-only">. Ver detalle</span>
                </span>
              }
            >
              {item.body || null}
            </AccountListItem>
          );
        })}
      </AccountItemList>

      <p className="mt-6 type-body-sm text-text-secondary">
        ¿Querés avisar a tus invitados?{" "}
        <Link
          href="/mi-cuenta/invitar"
          className="focus-ring rounded-sm font-semibold text-text-link underline-offset-2 hover:underline"
        >
          Compartir el micrositio
        </Link>
      </p>
    </AccountSection>
  );
}
