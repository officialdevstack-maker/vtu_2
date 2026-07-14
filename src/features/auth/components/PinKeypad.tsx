import { Delete, RotateCcw } from "lucide-react";

export function PinDots({ length = 4, filled }: { length?: number; filled: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full transition-all duration-150 ${
            i < filled ? "scale-100 bg-slate-900" : "scale-90 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinKeypad({
  onDigit,
  onBackspace,
  onClear,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-2.5 min-[380px]:gap-3">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(key)}
          className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-xl font-semibold text-slate-900 transition-all duration-150 hover:bg-slate-100 active:scale-95 disabled:opacity-50 min-[380px]:h-16"
        >
          {key}
        </button>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        aria-label="Clear"
        className="flex h-14 w-full items-center justify-center rounded-2xl text-slate-400 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-50 min-[380px]:h-16"
      >
        <RotateCcw className="h-5 w-5" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit("0")}
        className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-xl font-semibold text-slate-900 transition-all duration-150 hover:bg-slate-100 active:scale-95 disabled:opacity-50 min-[380px]:h-16"
      >
        0
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        aria-label="Backspace"
        className="flex h-14 w-full items-center justify-center rounded-2xl text-slate-400 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-50 min-[380px]:h-16"
      >
        <Delete className="h-5 w-5" />
      </button>
    </div>
  );
}
