"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import type { PanelNotificationItem } from "@/lib/notifications/queries";
import {
  formatNotificationRelative,
  notificationTypeBadgeClass,
  notificationTypeLabel,
} from "@/lib/notifications/format";
import { useToast } from "@/components/ui/ToastProvider";

const POLL_MS = 25_000;

interface AccountNotificationsBellProps {
  items: PanelNotificationItem[];
  unreadCount: number;
}

export function AccountNotificationsBell({
  items: initialItems,
  unreadCount: initialUnreadCount,
}: AccountNotificationsBellProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(
    new Set(initialItems.map((item) => item.id)),
  );
  const primedRef = useRef(false);
  const titleId = useId();

  // Si el servidor manda notificaciones nuevas (navegación/refresh), sincronizar el estado.
  const [syncedProps, setSyncedProps] = useState({
    initialItems,
    initialUnreadCount,
  });
  if (
    syncedProps.initialItems !== initialItems ||
    syncedProps.initialUnreadCount !== initialUnreadCount
  ) {
    setSyncedProps({ initialItems, initialUnreadCount });
    setItems(initialItems);
    setUnreadCount(initialUnreadCount);
  }

  useEffect(() => {
    for (const item of initialItems) {
      knownIdsRef.current.add(item.id);
    }
  }, [initialItems]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/mi-cuenta/notifications", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          items: PanelNotificationItem[];
          unreadCount: number;
        };
        if (cancelled) return;

        const fresh = data.items.filter(
          (item) => !knownIdsRef.current.has(item.id) && !item.readAt,
        );
        for (const item of data.items) {
          knownIdsRef.current.add(item.id);
        }

        if (primedRef.current && fresh.length > 0) {
          pushToast(fresh[0].title, "info");
        }
        primedRef.current = true;

        setItems(data.items);
        setUnreadCount(data.unreadCount);
      } catch {
        // Silencioso: el próximo poll reintenta.
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pushToast]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((value) => {
      const next = !value;
      if (next) {
        void fetch("/api/mi-cuenta/notifications", { cache: "no-store" })
          .then(async (res) => {
            if (!res.ok) return;
            const data = (await res.json()) as {
              items: PanelNotificationItem[];
              unreadCount: number;
            };
            for (const item of data.items) {
              knownIdsRef.current.add(item.id);
            }
            setItems(data.items);
            setUnreadCount(data.unreadCount);
          })
          .catch(() => undefined);
      }
      return next;
    });
  }

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
    setOpen(false);
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-default text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-status-error-fg px-1 text-[10px] font-bold text-text-inverse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-border-subtle bg-surface-default shadow-elevation-3"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div>
              <p
                id={titleId}
                className="type-label text-text-primary"
              >
                Notificaciones
              </p>
              <p className="type-caption text-text-tertiary">
                {unreadCount > 0
                  ? `${unreadCount} sin leer`
                  : "Estás al día"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={markAll}
                className="focus-ring rounded-sm type-caption font-semibold text-text-accent hover:underline disabled:opacity-60"
              >
                Marcar leídas
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center type-body-sm text-text-secondary">
              Todavía no hay novedades. Cuando alguien confirme o regale, vas a
              verlo acá.
            </p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto">
              {items.map((item) => {
                const unread = !item.readAt;
                return (
                  <li
                    key={item.id}
                    className="border-b border-border-subtle last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`focus-ring flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                        unread ? "bg-surface-brand/25" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${notificationTypeBadgeClass(item.type)}`}
                        >
                          {notificationTypeLabel(item.type)}
                        </span>
                        <span className="text-[11px] text-text-tertiary">
                          {formatNotificationRelative(item.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          unread
                            ? "font-semibold text-text-primary"
                            : "font-medium text-text-secondary"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.body ? (
                        <p className="line-clamp-2 type-caption text-text-tertiary">
                          {item.body}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-border-subtle px-4 py-2.5">
            <Link
              href="/mi-cuenta/notificaciones"
              onClick={() => setOpen(false)}
              className="focus-ring rounded-sm type-caption font-semibold text-text-accent hover:underline"
            >
              Ver historial →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
