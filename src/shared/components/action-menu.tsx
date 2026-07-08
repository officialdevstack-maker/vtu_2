import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";

export type ActionMenuItem = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  separatorBefore?: boolean;
};

const MENU_WIDTH = 176; // matches w-44
const ITEM_HEIGHT = 34;

// Row-action dropdown rendered through a portal with fixed positioning so it
// can never be clipped by table wrappers (overflow-x-auto / overflow-hidden).
export function ActionMenu({
  items,
  label = "Actions",
}: {
  items: ActionMenuItem[];
  label?: string;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (pos) {
      setPos(null);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const separators = items.filter((i) => i.separatorBefore).length;
    const height = items.length * ITEM_HEIGHT + separators * 9 + 10;
    const openUp = rect.bottom + height + 8 > window.innerHeight;
    setPos({
      top: openUp ? Math.max(8, rect.top - height - 4) : rect.bottom + 4,
      left: Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8,
      ),
    });
  };

  // Fixed coordinates go stale the moment anything scrolls or resizes.
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
        title={label}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPos(null)} />
            <div
              className="fixed z-50 w-44 bg-white border border-slate-200/70 rounded-xl shadow-md py-1"
              style={{ top: pos.top, left: pos.left }}
            >
              {items.map((item) => (
                <div key={item.label}>
                  {item.separatorBefore && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                  <button
                    disabled={item.disabled}
                    onClick={() => {
                      setPos(null);
                      item.onClick();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-50 ${
                      item.tone === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.icon && <item.icon className="w-3.5 h-3.5" />}
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
