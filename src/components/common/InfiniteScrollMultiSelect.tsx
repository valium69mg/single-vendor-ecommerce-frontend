import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useDebounce from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import type { PageResponse } from "@/api/api";

const PAGE_SIZE = 20;

interface InfiniteScrollMultiSelectProps<T> {
  queryKeyPrefix: readonly unknown[];
  fetchFn: (page: number, size: number, term: string) => Promise<PageResponse<T>>;
  getLabel: (item: T) => string;
  getId: (item: T) => number;
  selectedIds: number[];
  selectedLabels: string[];
  onSelect: (ids: number[], labels: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  label?: string;
  /** Render dropdown via portal — use inside modals/scrollable containers */
  modal?: boolean;
}

export function InfiniteScrollMultiSelect<T>({
  queryKeyPrefix,
  fetchFn,
  getLabel,
  getId,
  selectedIds,
  selectedLabels,
  onSelect,
  placeholder,
  searchPlaceholder = "Buscar...",
  label,
  modal = false,
}: InfiniteScrollMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce({ value: searchInput, delay: 400 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

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

  useEffect(() => {
    if (open && modal && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200),
        zIndex: 9999,
      });
    }
  }, [open, modal]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = modal ? dropdownRef.current?.contains(target) : false;
      if (!insideContainer && !insideDropdown) {
        setOpen(false);
        setSearchInput("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, modal]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

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

  const handleToggleItem = (item: T) => {
    const id = getId(item);
    const lbl = getLabel(item);
    if (selectedIds.includes(id)) {
      const idx = selectedIds.indexOf(id);
      const newIds = selectedIds.filter((_, i) => i !== idx);
      const newLabels = selectedLabels.filter((_, i) => i !== idx);
      onSelect(newIds, newLabels);
    } else {
      onSelect([...selectedIds, id], [...selectedLabels, lbl]);
    }
    setOpen(false);
    setSearchInput("");
  };

  const handleRemoveTag = (id: number) => {
    const idx = selectedIds.indexOf(id);
    if (idx === -1) return;
    const newIds = selectedIds.filter((_, i) => i !== idx);
    const newLabels = selectedLabels.filter((_, i) => i !== idx);
    onSelect(newIds, newLabels);
  };

  const triggerLabel =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === 1
        ? selectedLabels[0]
        : `${selectedIds.length} seleccionados`;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={modal ? { ...dropdownStyle, pointerEvents: "auto" } : undefined}
      className={cn(
        "bg-white border border-stone-200 shadow-md rounded-none",
        modal ? "" : "absolute top-full left-0 z-50 mt-1 min-w-[200px] w-full",
      )}
    >
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

      <div className="max-h-52 overflow-y-auto" onWheelCapture={(e) => e.stopPropagation()}>
        {items.map((item) => {
          const id = getId(item);
          const lbl = getLabel(item);
          const isSelected = selectedIds.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm font-store-body hover:bg-stone-50 transition-colors flex items-center justify-between gap-2",
                isSelected && "bg-stone-100",
              )}
              onClick={() => handleToggleItem(item)}
            >
              <span className="truncate">{lbl}</span>
              {isSelected && (
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
  );

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {label && (
        <span className="text-xs text-stone-500 font-store-body">{label}</span>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center justify-between gap-2 h-9 px-3 min-w-[150px] border border-stone-300 bg-white text-sm font-store-body text-stone-700 rounded-none",
          "hover:bg-stone-50 transition-colors focus:outline-none",
          open && "border-stone-600",
          selectedIds.length > 0 && "border-stone-500",
        )}
      >
        <span className="truncate text-left flex-1">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-stone-400 transition-transform duration-150 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Selected tags */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedIds.map((id, idx) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-store-body bg-stone-100 border border-stone-300 text-stone-700 rounded-none"
            >
              {selectedLabels[idx]}
              <button
                type="button"
                onClick={() => handleRemoveTag(id)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        modal
          ? createPortal(dropdownContent, document.body)
          : dropdownContent
      )}
    </div>
  );
}
