import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { EmptyState, inputCls } from "../../../../user/components/shared-ui";
import type { LucideIcon } from "lucide-react";

export function TableShell({
  heads,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  heads: { label: string; align?: "left" | "right" | "center" }[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {heads.map((h) => (
              <th
                key={h.label}
                className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${
                  h.align === "right"
                    ? "text-right"
                    : h.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={heads.length}>
              <EmptyState
                icon={emptyIcon}
                title={emptyTitle}
                description={emptyDescription}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
      {children}
    </div>
  );
}

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input placeholder={placeholder} className={`${inputCls} pl-9 py-2`} readOnly />
    </div>
  );
}

export function SelectFilter({
  placeholder,
  options,
}: {
  placeholder: string;
  options: string[];
}) {
  return (
    <select className={`${inputCls} py-2 w-auto`} defaultValue="">
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
