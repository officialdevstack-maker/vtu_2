import { useEffect, useRef, useState } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customerService } from "../services/customerService";
import { inputCls } from "./shared-ui";

type RecentPhoneInputProps = {
  value: string;
  onChange: (phone: string) => void;
  placeholder?: string;
};

const recentRecipientsQueryKey = ["recent-recipients"] as const;

export function RecentPhoneInput({
  value,
  onChange,
  placeholder = "08012345678",
}: RecentPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const recipientsQuery = useQuery({
    queryKey: recentRecipientsQueryKey,
    queryFn: customerService.getRecentRecipients,
  });
  const recipients = recipientsQuery.data ?? [];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: recentRecipientsQueryKey });

  const remove = async (id: number) => {
    try {
      await customerService.removeRecentRecipient(id);
      await refresh();
    } catch {
      // Keep the current list visible if the request fails; a later refetch
      // remains authoritative.
    }
  };

  const clear = async () => {
    try {
      await customerService.clearRecentRecipients();
      setOpen(false);
      await refresh();
    } catch {
      // Do not optimistically hide personal data that was not removed.
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        maxLength={11}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        className={`${inputCls} pr-11 font-mono`}
      />
      {recipients.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label="Choose a recent phone number"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {open && recipients.length > 0 && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-xs font-medium text-slate-500">Recent numbers</span>
            <button
              type="button"
              onClick={() => void clear()}
              className="text-xs text-slate-400 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
          <ul role="listbox" aria-label="Recent phone numbers" className="max-h-60 overflow-y-auto py-1">
            {recipients.map((recipient) => (
              <li key={recipient.id} role="none" className="group flex min-h-11 items-center">
                <button
                  type="button"
                  role="option"
                  aria-selected={recipient.phone === value}
                  onClick={() => {
                    onChange(recipient.phone);
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 px-3 py-2 text-left font-mono text-sm text-slate-800 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  {recipient.phone}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(recipient.id)}
                  aria-label={`Remove ${recipient.phone}`}
                  className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <Trash2 className="hidden h-3.5 w-3.5 sm:block" />
                  <X className="h-4 w-4 sm:hidden" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
