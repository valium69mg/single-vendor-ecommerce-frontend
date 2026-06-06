import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useDebounce from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import type { PageResponse } from "@/api/api";

const PAGE_SIZE = 20;

interface InfiniteScrollSelectProps<T> {
  queryKeyPrefix: readonly unknown[];
  fetchFn: (page: number, size: number, term: string) => Promise<PageResponse<T>>;
  getLabel: (item: T) => string;
  getId: (item: T) => number;
  selectedId: number | undefined;
  selectedLabel: string | undefined;
  onSelect: (id: number | undefined, label: string | undefined) => void;
  allLabel: string;
  searchPlaceholder?: string;
  label?: string;
}

export function InfiniteScrollSelect<T>({
  queryKeyPrefix,
  fetchFn,
  getLabel,
  getId,
  selectedId,
  selectedLabel,
  onSelect,
  allLabel,
  searchPlaceholder = "Buscar...",
  label,
}: InfiniteScrollSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce({ value: searchInput, delay: 400 });
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [...queryKeyPrefix, debouncedSearch],
      queryFn: ({ pageParam }) =>
        fetchFn(pageParam as number, PAGE_SIZE, debouncedSearch),
      initialPageParam: 0,
      getNextPageParam: (lastPage: PageResponse<T>) =>
        lastPage.last ? undefined : lastPage.page + 1,
      enabled: open,
    });

  const items = data?.pages.flatMap((p) => p.content) ?? [];

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // sentinel for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  const handleSelect = (item: T) => {
    const id = getId(item);
    if (selectedId === id) {
      onSelect(undefined, undefined);
    } else {
      onSelect(id, getLabel(item));
    }
    setOpen(false);
    setSearchInput("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined, undefined);
  };

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      setSearchInput("");
    } else {
      setOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {label && (
        <span className="text-xs text-stone-500 font-store-body">{label}</span>
      )}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-between gap-2 h-9 px-3 min-w-[150px] border border-stone-300 bg-white text-sm font-store-body text-stone-700 rounded-none",
          "hover:bg-stone-50 transition-colors focus:outline-none",
          open && "border-stone-600",
          selectedId !== undefined && "border-stone-500",
        )}
      >
        <span className="truncate text-left flex-1">
          {selectedLabel ?? allLabel}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedId !== undefined && (
            <X
              className="h-3 w-3 text-stone-400 hover:text-stone-700"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-stone-400 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[200px] w-full bg-white border border-stone-200 shadow-md rounded-none">
          <div className="p-2 border-b border-stone-100">
            <Input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-7 text-xs rounded-none border-stone-200 focus:border-stone-400"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {/* "All" option */}
            <button
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm font-store-body hover:bg-stone-50 transition-colors",
                selectedId === undefined && "bg-stone-100 font-medium",
              )}
              onClick={() => {
                onSelect(undefined, undefined);
                setOpen(false);
                setSearchInput("");
              }}
            >
              {allLabel}
            </button>

            {items.map((item) => {
              const id = getId(item);
              const lbl = getLabel(item);
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-store-body hover:bg-stone-50 transition-colors flex items-center justify-between gap-2",
                    selectedId === id && "bg-stone-100 font-medium",
                  )}
                  onClick={() => handleSelect(item)}
                >
                  <span className="truncate">{lbl}</span>
                  {selectedId === id && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-stone-600" />
                  )}
                </button>
              );
            })}

            <div ref={sentinelRef} className="h-2" />

            {isFetchingNextPage && (
              <p className="px-3 py-2 text-xs text-stone-400 text-center font-store-body">
                Cargando...
              </p>
            )}

            {!isFetchingNextPage && items.length === 0 && (
              <p className="px-3 py-2 text-xs text-stone-400 text-center font-store-body">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
