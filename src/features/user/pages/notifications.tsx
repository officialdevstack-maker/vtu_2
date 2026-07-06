import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { PageHeader, Card, EmptyState, SkeletonLine } from "../components/shared-ui";
import { notificationService, type AppNotification } from "@/shared/notificationService";
import { notificationIcon, toneStyles, dateLabel } from "@/shared/notificationDisplay";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const notifsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getAll(),
  });
  const notifs = notifsQuery.data ?? [];
  const unreadCount = notifs.filter((n) => !n.read_at).length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
  };

  const handleMarkRead = async (n: AppNotification) => {
    if (n.read_at) return;
    await notificationService.markRead(n.id);
    invalidate();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    invalidate();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description={notifsQuery.isPending ? "Loading…" : `${unreadCount} unread`}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={() => void handleMarkAllRead()}
              className="text-[#111827] text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Mark all as read
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
          <div className="divide-y divide-gray-100">
            {notifs.map((n) => {
              const { icon: Icon, tone } = notificationIcon(n.data.type);
              const unread = !n.read_at;
              return (
                <div
                  key={n.id}
                  onClick={() => void handleMarkRead(n)}
                  className={`flex gap-3.5 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${unread ? "bg-[#111827]/5" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full ${toneStyles[tone]} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-slate-900 text-sm font-medium">{n.data.title}</p>
                      {unread && <span className="w-1.5 h-1.5 bg-[#111827] rounded-full shrink-0" />}
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{n.data.body}</p>
                    <p className="text-slate-400 text-xs mt-1.5">{dateLabel(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
