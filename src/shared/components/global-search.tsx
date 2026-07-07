import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Users, Receipt, PlugZap, Wifi, Network } from "lucide-react";
import { searchService, type SearchResult, type SearchResultType } from "@shared/searchService";

const TYPE_ICON: Record<SearchResultType, typeof Search> = {
  customer: Users,
  transaction: Receipt,
  provider: PlugZap,
  data_plan: Wifi,
  affiliate: Network,
};

const TYPE_LABEL: Record<SearchResultType, string> = {
  customer: "Customer",
  transaction: "Transaction",
  provider: "Provider",
  data_plan: "Data plan",
  affiliate: "Affiliate",
};

// Debounced so every keystroke doesn't fire a request — 250ms is short
// enough to still feel instant, long enough to skip the in-between states
// of fast typing.
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export default function GlobalSearch({
  scope,
  wrapperClassName,
  placeholder = "Search",
}: {
  scope: "admin" | "user";
  wrapperClassName: string;
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const handle = setTimeout(() => {
      const search = scope === "admin" ? searchService.admin : searchService.user;
      search(trimmed)
        .then((r) => {
          setResults(r);
          setSearched(true);
        })
        .catch(() => {
          setResults([]);
          setSearched(true);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query, scope]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(result.path);
  };

  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative">
      <div className={wrapperClassName}>
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 text-slate-400 animate-spin" />}
      </div>

      {showPanel && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              {searched ? `No results for "${query.trim()}"` : "Keep typing to search…"}
            </div>
          ) : (
            <div className="py-1">
              {results.map((r) => {
                const Icon = TYPE_ICON[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-slate-300 shrink-0">{TYPE_LABEL[r.type]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
