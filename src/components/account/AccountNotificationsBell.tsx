"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import type { PanelNotificationItem } from "@/lib/notifications/queries";
import { useToast } from "@/components/ui/ToastProvider";

const POLL_MS = 25_000;

interface AccountNotificationsBellProps {
  items: PanelNotificationItem[];
  unreadCount: number;
}

function typeLabel(type: string): string {
  if (type === "rsvp") return "RSVP";
  if (type === "gift") return "Regalo";
  if (type === "plan") return "Plan";
  return "Aviso";
}

function typeBadgeClass(type: string): string {
  if (type === "rsvp") return "bg-emerald-50 text-emerald-800";
  if (type === "gift") return "bg-amber-50 text-amber-900";
  if (type === "plan") return "bg-sky-50 text-sky-900";
  return "bg-stone-100 text-stone-700";
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString("es-AR");
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

  useEffect(() => {
    setItems(initialItems);
    setUnreadCount(initialUnreadCount);
    for (const item of initialItems) {
      knownIdsRef.current.add(item.id);
    }
  }, [initialItems, initialUnreadCount]);

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
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
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
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div>
              <p
                id={titleId}
                className="text-sm font-semibold text-stone-800"
              >
                Notificaciones
              </p>
              <p className="text-xs text-stone-500">
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
                className="text-xs font-semibold text-[#6f5f47] hover:underline disabled:opacity-60"
              >
                Marcar leídas
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-500">
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
                    className="border-b border-stone-50 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-stone-50 ${
                        unread ? "bg-[#e6dac7]/15" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeBadgeClass(item.type)}`}
                        >
                          {typeLabel(item.type)}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {formatRelative(item.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          unread
                            ? "font-semibold text-stone-900"
                            : "font-medium text-stone-800"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.body ? (
                        <p className="line-clamp-2 text-xs text-stone-500">
                          {item.body}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-stone-100 px-4 py-2.5">
            <Link
              href="/mi-cuenta"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Ir al resumen →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
