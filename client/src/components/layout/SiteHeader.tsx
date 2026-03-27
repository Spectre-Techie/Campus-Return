"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Bell, Menu, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { closeRealtimeSocket, getRealtimeSocket } from "@/lib/realtime/socket";
import type { Notification } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/items", label: "Items" },
  { href: "/dashboard", label: "My Flow" },
  { href: "/analytics", label: "Analytics" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { userId, getToken } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const fetchNotifications = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) return;
    const silent = options?.silent ?? false;
    if (!silent) setLoadingNotifications(true);

    try {
      const token = await getToken();
      const { data } = await api.get("/api/notifications?limit=12", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(data.data as Notification[]);
    } catch {
      // Keep shell resilient if notification endpoint fails.
    } finally {
      if (!silent) setLoadingNotifications(false);
    }
  }, [getToken, userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [fetchNotifications, userId]);

  useEffect(() => {
    if (!userId) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications({ silent: true });
      }
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications, userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = getRealtimeSocket(userId);
    const handleNotification = () => {
      fetchNotifications({ silent: true });
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [fetchNotifications, userId]);

  useEffect(() => {
    if (!userId) closeRealtimeSocket();
  }, [userId]);

  useEffect(() => {
    if (notificationsOpen) fetchNotifications();
  }, [fetchNotifications, notificationsOpen]);

  async function markAllRead() {
    try {
      const token = await getToken();
      await api.patch(
        "/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const now = new Date().toISOString();
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, readAt: notification.readAt ?? now }))
      );
    } catch {
      // no-op
    }
  }

  async function markRead(notificationId: string) {
    try {
      const token = await getToken();
      await api.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() }
            : notification
        )
      );
    } catch {
      // no-op
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/92 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="inline-flex min-w-0 items-center gap-2.5 text-[var(--ink)]">
          <span className="brand-gradient inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm">
            CR
          </span>
          <span className="min-w-0">
            <span className="font-display block truncate text-[15px] font-semibold tracking-tight sm:text-base">Campus Return</span>
            <span className="block truncate text-[11px] text-[var(--ink-muted)]">Secure Lost and Found</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand-deep)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Show
            when="signed-in"
            fallback={
              <SignInButton mode="modal">
                <button className="rounded-full bg-[var(--brand-deep)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Sign In
                </button>
              </SignInButton>
            }
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative rounded-full border border-[var(--border)] bg-white p-2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-[min(22rem,90vw)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_16px_38px_rgba(30,43,54,0.14)]">
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[var(--ink)]">Notifications</p>
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {loadingNotifications ? (
                      <p className="px-3 py-4 text-sm text-[var(--ink-muted)]">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-[var(--ink-muted)]">No notifications yet.</p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markRead(notification.id)}
                          className={`block w-full border-b border-[var(--border)] px-3 py-2.5 text-left hover:bg-[var(--brand-soft)] ${
                            notification.readAt ? "bg-white" : "bg-[var(--brand-soft)]/40"
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                            {notification.type.replace(/_/g, " ")}
                          </p>
                          <p className="mt-1 text-sm text-[var(--ink)]">
                            {notification.content || "New update"}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/items/post"
              className="hidden items-center gap-1 rounded-full bg-[var(--brand-deep)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Post
            </Link>

            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 border border-[var(--border)] shadow-sm",
                  userButtonTrigger: "rounded-full ring-0",
                },
              }}
            />
          </Show>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex rounded-full border border-[var(--border)] bg-white p-2 text-[var(--ink-muted)] md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === item.href
                    ? "bg-[var(--brand-soft)] text-[var(--brand-deep)]"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/items/post"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-deep)] px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Post Item
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
