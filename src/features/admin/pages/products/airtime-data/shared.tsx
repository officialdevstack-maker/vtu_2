import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { EmptyState, inputCls, selectCls } from "../../../../user/components/shared-ui";
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
    <div className="max-w-full overflow-x-auto">
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
    <div className="flex min-w-0 flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input placeholder={placeholder} className={`${inputCls} pl-9 py-2`} readOnly />
    </div>
  );
}

type SelectOption = string | { value: string; label: string };

export function SelectFilter({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: SelectOption[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <select
      className={`${selectCls} min-w-0 py-2 w-full sm:w-44`}
      {...(controlled
        ? { value, onChange: (e) => onChange(e.target.value) }
        : { defaultValue: "" })}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
