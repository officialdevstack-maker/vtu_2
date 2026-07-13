import { useEffect } from "react";
import { PartyPopper, X } from "lucide-react";

export function WelcomeMessageModal({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 safe-modal-inset sm:p-4" role="dialog" aria-modal="true" aria-label="Welcome message">
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 text-center shadow-2xl animate-bounce-in sm:p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 rounded-md text-slate-400 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#111827]/10 text-[#111827]">
          <PartyPopper className="h-7 w-7" />
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-line">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#111827] py-2.5 text-sm font-medium text-white hover:bg-[#111827] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
