import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import SearchBar from "@/components/common/SearchBar";
import { InfiniteScrollSelect } from "@/components/common/InfiniteScrollSelect";
import { useProductColumns } from "@/hooks/useProductColumns";
import { useUser } from "@/hooks/useUser";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import {
  getAdminProducts,
  getAdminCategories,
  getAdminBrands,
  type Category,
  type AdminBrand,
} from "@/api/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Filter state ─────────────────────────────────────────────────────────────

interface ProductFilters {
  sortBy: string;
  sortDirection: "ASC" | "DESC";
  size: number;
  status: string;
  featured: "" | "true" | "false";
  categoryId: number | undefined;
  categoryLabel: string | undefined;
  brandId: number | undefined;
  brandLabel: string | undefined;
}

const DEFAULT_FILTERS: ProductFilters = {
  sortBy: "",
  sortDirection: "ASC",
  size: 10,
  status: "",
  featured: "",
  categoryId: undefined,
  categoryLabel: undefined,
  brandId: undefined,
  brandLabel: undefined,
};

// ─── Styled select helper ─────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-stone-500 font-store-body">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 border border-stone-300 rounded-none bg-white px-2 text-sm font-store-body text-stone-700",
          "focus:outline-none focus:border-stone-600 hover:bg-stone-50 transition-colors cursor-pointer",
          "min-w-[130px]",
        )}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError } = useApiErrorHandler();

  const [page, setPage] = useState(0);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = useProductColumns();

  // ── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "products",
      page,
      filters.size,
      term,
      filters.sortBy,
      filters.sortDirection,
      filters.status,
      filters.featured,
      filters.categoryId,
      filters.brandId,
    ],
    queryFn: () =>
      getAdminProducts(
        {
          page,
          size: filters.size,
          term: term || undefined,
          sortBy: filters.sortBy || undefined,
          sortDirection: filters.sortBy ? filters.sortDirection : undefined,
          status: filters.status || undefined,
          featured:
            filters.featured === "true"
              ? true
              : filters.featured === "false"
                ? false
                : undefined,
          categoryId: filters.categoryId,
          brandId: filters.brandId,
        },
        user!.token,
      ),
    enabled: !!user?.token,
    throwOnError,
  });

  // ── Filter helpers ─────────────────────────────────────────────────────────

  const setFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  const hasActiveFilters =
    filters.sortBy !== "" ||
    filters.status !== "" ||
    filters.featured !== "" ||
    filters.categoryId !== undefined ||
    filters.brandId !== undefined;

  // ── Infinite scroll fetch fns (stable refs) ────────────────────────────────

  const fetchCategories = useCallback(
    (p: number, s: number, q: string) =>
      getAdminCategories(p, s, q, user!.token),
    [user],
  );

  const fetchBrands = useCallback(
    (p: number, s: number, q: string) =>
      getAdminBrands(p, s, q, user!.token),
    [user],
  );

  const handleTermChange = (val: string) => {
    setTerm(val);
    setPage(0);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-store-heading text-3xl font-semibold text-stone-900">
          {t("products")}
        </h1>
        <button
          type="button"
          disabled
          title={t("comingSoon")}
          className={cn(
            "bg-stone-300 text-stone-500 border border-stone-300 cursor-not-allowed",
            "font-store-body text-sm tracking-wide h-9 px-4 rounded-none opacity-60",
          )}
        >
          + {t("createProduct")}
        </button>
      </div>

      {/* ── Search + filter toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="w-full sm:w-64 lg:w-80">
          <SearchBar
            placeholder={`${t("searchFor")} ${t("products").toLowerCase()}...`}
            query={term}
            setQuery={handleTermChange}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filters toggle — always visible on lg+, button on smaller screens */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((p) => !p)}
            className={cn(
              "rounded-none font-store-body flex items-center gap-1.5 h-9 px-3",
              "lg:hidden",
              filtersOpen && "bg-stone-100",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t("filters")}
            {hasActiveFilters && (
              <span className="ml-1 h-2 w-2 rounded-full bg-amber-600 inline-block" />
            )}
          </Button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-store-body transition-colors"
            >
              <X className="h-3 w-3" />
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* ── Filters panel ── */}
      {/* Mobile: controlled by filtersOpen; lg+: always visible */}
      <div
        className={cn(
          "flex-wrap gap-3 items-end",
          "lg:flex", // always flex on large screens
          filtersOpen ? "flex" : "hidden lg:flex",
        )}
      >
        {/* Sort by */}
        <FilterSelect
          label={t("sortBy")}
          value={filters.sortBy}
          onChange={(v) => setFilter("sortBy", v)}
        >
          <option value="">{t("all")}</option>
          <option value="name">{t("name")}</option>
          <option value="price">{t("price")}</option>
          <option value="stock">{t("stock")}</option>
          <option value="unitsSold">{t("unitsSold")}</option>
        </FilterSelect>

        {/* Sort direction — only useful when sortBy is set */}
        {filters.sortBy && (
          <FilterSelect
            label={t("sortDirection")}
            value={filters.sortDirection}
            onChange={(v) => setFilter("sortDirection", v as "ASC" | "DESC")}
          >
            <option value="ASC">{t("ascending")}</option>
            <option value="DESC">{t("descending")}</option>
          </FilterSelect>
        )}

        {/* Per page */}
        <FilterSelect
          label={t("perPage")}
          value={String(filters.size)}
          onChange={(v) => {
            setFilter("size", Number(v));
          }}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </FilterSelect>

        {/* Status */}
        <FilterSelect
          label={t("status")}
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
        >
          <option value="">{t("all")}</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="DRAFT">Borrador</option>
        </FilterSelect>

        {/* Featured */}
        <FilterSelect
          label={t("featured")}
          value={filters.featured}
          onChange={(v) => setFilter("featured", v as "" | "true" | "false")}
        >
          <option value="">{t("all")}</option>
          <option value="true">{t("yes")}</option>
          <option value="false">{t("no")}</option>
        </FilterSelect>

        {/* Category — infinite scroll */}
        <InfiniteScrollSelect<Category>
          label={t("category")}
          queryKeyPrefix={["admin", "filter", "categories"]}
          fetchFn={fetchCategories}
          getId={(cat) => cat.categoryId}
          getLabel={(cat) => cat.name}
          selectedId={filters.categoryId}
          selectedLabel={filters.categoryLabel}
          onSelect={(id, lbl) => {
            setFilters((prev) => ({
              ...prev,
              categoryId: id,
              categoryLabel: lbl,
            }));
            setPage(0);
          }}
          allLabel={t("all")}
          searchPlaceholder={`${t("searchFor")} ${t("categories").toLowerCase()}...`}
        />

        {/* Brand — infinite scroll */}
        <InfiniteScrollSelect<AdminBrand>
          label={t("brands")}
          queryKeyPrefix={["admin", "filter", "brands"]}
          fetchFn={fetchBrands}
          getId={(brand) => brand.brandId}
          getLabel={(brand) => brand.name}
          selectedId={filters.brandId}
          selectedLabel={filters.brandLabel}
          onSelect={(id, lbl) => {
            setFilters((prev) => ({
              ...prev,
              brandId: id,
              brandLabel: lbl,
            }));
            setPage(0);
          }}
          allLabel={t("all")}
          searchPlaceholder={`${t("searchFor")} ${t("brands").toLowerCase()}...`}
        />

        {/* Clear filters — inline on large screens */}
        {hasActiveFilters && (
          <div className="hidden lg:flex flex-col justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-store-body transition-colors whitespace-nowrap px-1"
            >
              <X className="h-3 w-3" />
              {t("clearFilters")}
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={data?.content ?? []}
          page={page}
          setPage={setPage}
          loading={isLoading}
          hasNextPage={data ? !data.last : false}
          labels={{
            previous: t("previous"),
            next: t("next"),
            page: t("page"),
            noResults: t("noResults"),
          }}
        />
      </div>
    </div>
  );
}
