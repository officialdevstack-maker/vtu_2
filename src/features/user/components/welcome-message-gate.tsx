import { useEffect, useState } from "react";
import { WelcomeMessageModal } from "./welcome-message-modal";
import { welcomeMessageService, type WelcomeMessage } from "@shared/welcome-message";

// Mounted once in the customer-facing layout, so it runs right after login
// routes the user to their dashboard. Asks the backend for the active
// welcome message and whether THIS user has already seen the current
// version; shows the modal once per version, then records that it was seen.
export function WelcomeMessageGate() {
  const [message, setMessage] = useState<WelcomeMessage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    welcomeMessageService
      .getForUser()
      .then(({ message, seen }) => {
        if (mounted && message && message.active && !seen) {
          setMessage(message);
          setOpen(true);
        }
      })
      .catch(() => {
        // A welcome message is non-essential — never let it block the app.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (message) {
      // Fire-and-forget: if this fails the modal just shows again next
      // login, which is harmless.
      void welcomeMessageService.markSeen(message.id).catch(() => {});
    }
  };

  if (!message) return null;

  return <WelcomeMessageModal open={open} message={message.body} onClose={handleClose} />;
}
