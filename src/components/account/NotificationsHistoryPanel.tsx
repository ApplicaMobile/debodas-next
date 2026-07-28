"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import {
  formatNotificationRelative,
  notificationTypeBadgeClass,
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
      <AccountEmptyState
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm sm:px-6">
        <p className="text-sm text-stone-600">
          {unreadCount > 0 ? (
            <>
              <strong className="text-stone-800">{unreadCount}</strong> sin leer
              de {items.length} avisos
            </>
          ) : (
            <>Estás al día · {items.length} avisos</>
          )}
        </p>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={markAll}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#6f5f47] hover:bg-stone-50 disabled:opacity-60"
          >
            Marcar todas como leídas
          </button>
        ) : null}
      </div>

      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {items.map((item) => {
          const unread = !item.readAt;
          return (
            <li
              key={item.id}
              className="border-b border-stone-100 last:border-0"
            >
              <button
                type="button"
                onClick={() => openItem(item)}
                className={`flex w-full flex-col gap-1.5 px-4 py-4 text-left transition hover:bg-stone-50 sm:px-6 ${
                  unread ? "bg-[#e6dac7]/12" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${notificationTypeBadgeClass(item.type)}`}
                  >
                    {notificationTypeLabel(item.type)}
                  </span>
                  <span className="text-xs text-stone-400">
                    {formatNotificationRelative(item.createdAt)}
                  </span>
                </div>
                <p
                  className={`text-sm sm:text-base ${
                    unread
                      ? "font-semibold text-stone-900"
                      : "font-medium text-stone-800"
                  }`}
                >
                  {item.title}
                </p>
                {item.body ? (
                  <p className="text-sm text-stone-500">{item.body}</p>
                ) : null}
                <span className="text-xs font-medium text-[#6f5f47]">
                  Ver detalle →
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-sm text-stone-500">
        ¿Querés avisar a tus invitados?{" "}
        <Link
          href="/mi-cuenta/invitar"
          className="font-medium text-[#6f5f47] hover:underline"
        >
          Compartir el micrositio
        </Link>
      </p>
    </div>
  );
}
