import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ExternalLink, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PageHeader,
  Card,
  EmptyState,
  Pagination,
  SkeletonLine,
} from "../components/shared-ui";
import {
  notificationService,
  type AppNotification,
  type NotificationPage,
} from "@/shared/notificationService";
import {
  notificationIcon,
  toneStyles,
  dateLabel,
} from "@/shared/notificationDisplay";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const notifsQuery = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationService.getAll(page, PAGE_SIZE),
  });
  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
  });

  const notifs = notifsQuery.data?.data ?? [];
  const meta = notifsQuery.data?.meta;
  const unreadCount = unreadQuery.data ?? 0;
  const unreadLabel =
    unreadCount === 1
      ? "1 unread notification"
      : `${unreadCount} unread notifications`;

  const updateCachedNotifications = (
    updater: (notification: AppNotification) => AppNotification,
  ) => {
    queryClient.setQueriesData<NotificationPage>(
      {
        predicate: (query) =>
          query.queryKey[0] === "notifications" &&
          typeof query.queryKey[1] === "number",
      },
      (current) =>
        current
          ? { ...current, data: current.data.map(updater) }
          : current,
    );
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const wasUnread = queryClient
        .getQueriesData<NotificationPage>({
          predicate: (query) =>
            query.queryKey[0] === "notifications" &&
            typeof query.queryKey[1] === "number",
        })
        .some(([, current]) =>
          current?.data.some(
            (notification) => notification.id === id && !notification.read_at,
          ),
        );

      const readAt = new Date().toISOString();
      updateCachedNotifications((notification) =>
        notification.id === id
          ? { ...notification, read_at: readAt }
          : notification,
      );
      queryClient.setQueryData<number>(
        ["notifications", "unread-count"],
        (current = 0) => (wasUnread ? Math.max(0, current - 1) : current),
      );

      return { wasUnread };
    },
    onError: () => {
      // The server remains authoritative. Refetch only on failure so a slow
      // request never makes the click feel unresponsive.
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const readAt = new Date().toISOString();
      updateCachedNotifications((notification) =>
        notification.read_at
          ? notification
          : { ...notification, read_at: readAt },
      );
      queryClient.setQueryData(["notifications", "unread-count"], 0);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleMarkRead = (n: AppNotification) => {
    if (n.read_at || markReadMutation.isPending) return;
    markReadMutation.mutate(n.id);
  };

  const handleView = (notification: AppNotification) => {
    setSelected(notification);
    handleMarkRead(notification);
  };

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const relatedPath = (notification: AppNotification): string | null => {
    const isAdmin = location.pathname.startsWith("/admin");
    const type = notification.data.type?.toLowerCase() ?? "";
    if (type.includes("transaction") || type.includes("subscription")) {
      return isAdmin ? "/admin/transactions" : "/transactions";
    }
    if (type.includes("withdrawal")) {
      return isAdmin ? "/admin/wallet-withdrawals" : "/wallet";
    }
    if (type.includes("airtime_to_cash")) {
      return isAdmin ? "/admin/airtime-to-cash" : "/airtime-to-cash";
    }
    if (type.includes("wallet") || type.includes("funding")) {
      return isAdmin ? "/admin/transactions" : "/wallet";
    }
    return null;
  };

  const handleMarkAllRead = () => {
    if (markAllReadMutation.isPending) return;
    markAllReadMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description={notifsQuery.isPending ? "Loading..." : unreadLabel}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="cursor-pointer text-[#111827] text-sm font-medium hover:opacity-80 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markAllReadMutation.isPending ? "Marking…" : "Mark all as read"}
            </button>
          ) : undefined
        }
      />
      <Card className="overflow-hidden">
        {notifsQuery.isPending ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Purchase updates, transfers, and account alerts will show up here."
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {notifs.map((n) => {
                const { icon: Icon, tone } = notificationIcon(n.data.type);
                const unread = !n.read_at;

                return (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => handleView(n)}
                    className={`flex w-full gap-3.5 p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                      unread ? "brand-unread-row" : ""
                    }`}
                    aria-label={`View notification: ${n.data.title}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${toneStyles[tone]} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-slate-900 text-sm font-medium">
                          {n.data.title}
                        </p>
                        {unread && (
                          <span className="brand-notification-dot w-1.5 h-1.5 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {n.data.body}
                      </p>
                      <p className="text-slate-400 text-xs mt-1.5">
                        {dateLabel(n.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {meta && meta.total > meta.per_page && (
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                totalItems={meta.total}
                pageSize={meta.per_page}
                onPageChange={setPage}
                label="notifications"
              />
            )}
          </>
        )}
      </Card>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-detail-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              {(() => {
                const { icon: Icon, tone } = notificationIcon(selected.data.type);
                return (
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneStyles[tone]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <h2 id="notification-detail-title" className="text-base font-semibold text-slate-900">
                  {selected.data.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">{dateLabel(selected.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close notification"
                autoFocus
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selected.data.body}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {relatedPath(selected) && (
                <button
                  type="button"
                  onClick={() => navigate(relatedPath(selected)!)}
                  className="brand-primary-button inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                >
                  View related activity <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
