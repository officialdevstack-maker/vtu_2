import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { welcomeMessageService } from "@shared/welcome-message";

const WelcomeMessageModal = lazy(() =>
  import("./welcome-message-modal").then((module) => ({
    default: module.WelcomeMessageModal,
  })),
);

// Mounted once in the customer-facing layout. Shows the active welcome
// message EVERY time the user lands on the dashboard — initial login,
// SPA navigation back to /dashboard, and hard refreshes — not once per
// version (the per-user "seen" flag is deliberately ignored; the admin's
// welcome message acts as a recurring announcement banner).
export function WelcomeMessageGate() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onDashboard = pathname === "/dashboard" || pathname === "/dashboard/";
  const messageQuery = useQuery({
    queryKey: ["welcome-message", "customer"],
    queryFn: () => welcomeMessageService.getForUser(),
    enabled: onDashboard,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const message = messageQuery.data?.message?.active
    ? messageQuery.data.message
    : null;

  // Re-open on every visit to the dashboard (message may arrive after the
  // first render, so this also depends on it being loaded).
  useEffect(() => {
    if (onDashboard && message) {
      setOpen(true);
    }
  }, [onDashboard, message]);

  const handleClose = () => setOpen(false);

  if (!message) return null;

  return (
    <Suspense fallback={null}>
      <WelcomeMessageModal open={open} message={message.body} onClose={handleClose} />
    </Suspense>
  );
}
