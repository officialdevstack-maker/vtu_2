import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { WelcomeMessageModal } from "./welcome-message-modal";
import { welcomeMessageService, type WelcomeMessage } from "@shared/welcome-message";

// Mounted once in the customer-facing layout. Shows the active welcome
// message EVERY time the user lands on the dashboard — initial login,
// SPA navigation back to /dashboard, and hard refreshes — not once per
// version (the per-user "seen" flag is deliberately ignored; the admin's
// welcome message acts as a recurring announcement banner).
export function WelcomeMessageGate() {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onDashboard = pathname === "/dashboard" || pathname === "/dashboard/";

  useEffect(() => {
    let mounted = true;

    welcomeMessageService
      .getForUser()
      .then(({ message }) => {
        if (mounted && message && message.active) {
          setMessage(message);
        }
      })
      .catch(() => {
        // A welcome message is non-essential — never let it block the app.
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Re-open on every visit to the dashboard (message may arrive after the
  // first render, so this also depends on it being loaded).
  useEffect(() => {
    if (onDashboard && message) {
      setOpen(true);
    }
  }, [onDashboard, message]);

  const handleClose = () => setOpen(false);

  if (!message) return null;

  return <WelcomeMessageModal open={open} message={message.body} onClose={handleClose} />;
}
