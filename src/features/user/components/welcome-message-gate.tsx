import { useEffect, useState } from "react";
import { WelcomeMessageModal } from "./welcome-message-modal";
import {
  getSeenMessageId,
  getWelcomeMessage,
  markMessageSeen,
  type WelcomeMessage,
} from "@shared/welcome-message";

// Mounted once in the customer-facing layout. Watches for a welcome message
// the admin has published and shows it once per message (tracked by id),
// including live across tabs — an admin editing the message in one tab
// pops the modal open in any customer tab that's already loaded.
export function WelcomeMessageGate() {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const msg = getWelcomeMessage();
      if (msg && msg.active && msg.id !== getSeenMessageId()) {
        setMessage(msg);
        setOpen(true);
      }
    };

    evaluate();

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "vendify-welcome-message") evaluate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleClose = () => {
    if (message) markMessageSeen(message.id);
    setOpen(false);
  };

  if (!message) return null;

  return (
    <WelcomeMessageModal open={open} title={message.title} message={message.body} onClose={handleClose} />
  );
}
