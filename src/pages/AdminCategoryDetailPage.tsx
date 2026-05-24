import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, AlertTriangle, Pencil } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getCategory, deleteCategory, API_FILE_URL } from "@/api/api";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { DataTable } from "@/components/common/DataTable";
import Modal from "@/components/common/Modal";
import EditCategoryForm from "@/components/admin/EditCategoryForm";
import EditImageForm from "@/components/admin/EditImageForm";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import ImageModal from "@/components/common/ImageModal";
import DestructiveActionButton from "@/components/common/DestructiveActionButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Loader from "@/components/common/Loader";
import { useToast } from "@/hooks/useToast";

const LOW_STOCK_THRESHOLD = 10;

interface MockProduct {
  productId: number;
  name: string;
  price: number;
  stock: number;
  unitsSold: number;
  revenue: number;
}

const TOP_PRODUCTS_MOCK: MockProduct[] = [
  { productId: 1, name: "Running Shoes Pro X", price: 129.99, stock: 45, unitsSold: 320, revenue: 41597 },
  { productId: 2, name: "Sport T-Shirt Elite", price: 34.99, stock: 200, unitsSold: 510, revenue: 17845 },
  { productId: 3, name: "Training Shorts Ultra", price: 49.99, stock: 130, unitsSold: 280, revenue: 13997 },
  { productId: 4, name: "Compression Socks", price: 19.99, stock: 400, unitsSold: 650, revenue: 12994 },
  { productId: 5, name: "Gym Bag Carry-All", price: 79.99, stock: 60, unitsSold: 150, revenue: 11999 },
];

const LOW_STOCK_PRODUCTS_MOCK: MockProduct[] = [
  { productId: 6, name: "Limited Edition Hoodie", price: 89.99, stock: 3, unitsSold: 97, revenue: 8729 },
  { productId: 7, name: "Performance Cap", price: 24.99, stock: 5, unitsSold: 215, revenue: 5373 },
  { productId: 8, name: "Water Bottle XL", price: 29.99, stock: 8, unitsSold: 189, revenue: 5668 },
  { productId: 9, name: "Resistance Bands Set", price: 44.99, stock: 2, unitsSold: 78, revenue: 3509 },
];

interface StatCardProps {
  label: string;
  value: string | number;
  warning?: boolean;
  warningLabel?: string;
}

function StatCard({ label, value, warning, warningLabel }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-none border p-4 flex flex-col gap-1 bg-white",
        warning ? "border-amber-400 bg-amber-50" : "border-stone-200"
      )}
    >
      <span className="font-store-body text-xs text-stone-500 uppercase tracking-wider">{label}</span>
      <span
        className={cn(
          "font-store-heading text-3xl font-semibold",
          warning ? "text-amber-700" : "text-stone-900"
        )}
      >
        {value}
      </span>
      {warning && warningLabel && (
        <span className="flex items-center gap-1 font-store-body text-xs text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          {warningLabel}
        </span>
      )}
    </div>
  );
}

export default function AdminCategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError, handleError } = useApiErrorHandler();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const id = Number(categoryId);

  const { data, isLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: () => getCategory(id, user!.token),
    enabled: !!user?.token && !isNaN(id),
    throwOnError,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteCategory(id, user!.token),
    onSuccess: () => {
      success(t("categoryDeletedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate("/admin/categories");
    },
    onError: (err: Error) => handleError(err, t("categoryNotDeletedSuccessfully")),
  });

  const topProductsColumns = useMemo<ColumnDef<MockProduct>[]>(
    () => [
      { accessorKey: "name", header: t("name") },
      {
        accessorKey: "price",
        header: t("price"),
        cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
      },
      { accessorKey: "unitsSold", header: t("unitsSold") },
      {
        accessorKey: "revenue",
        header: t("revenue"),
        cell: ({ row }) => `$${row.original.revenue.toLocaleString()}`,
      },
    ],
    [t]
  );

  const lowStockColumns = useMemo<ColumnDef<MockProduct>[]>(
    () => [
      { accessorKey: "name", header: t("name") },
      {
        accessorKey: "price",
        header: t("price"),
        cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
      },
      {
        accessorKey: "stock",
        header: t("stock"),
        cell: ({ row }) => (
          <span
            className={cn(
              "font-semibold",
              row.original.stock <= 5
                ? "text-red-600"
                : "text-amber-700"
            )}
          >
            {row.original.stock}
          </span>
        ),
      },
    ],
    [t]
  );

  const tableLabels = {
    previous: t("previous"),
    next: t("next"),
    page: t("page"),
    noResults: t("noResults"),
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/categories")}
          className="flex items-center gap-2 -ml-2"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </Button>
        <p className="text-muted-foreground">{t("noResults")}</p>
      </div>
    );
  }

  const imageUrl = data.mediumThumbnailUrl
    ? API_FILE_URL + data.mediumThumbnailUrl
    : undefined;

  const isLowStock = data.stock <= LOW_STOCK_THRESHOLD;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/categories")}
        className="flex items-center gap-2 -ml-2"
      >
        <ArrowLeft size={16} />
        {t("back")}
      </Button>

      {/* Header */}
      <div className="flex flex-row items-start gap-4">
        <ImageModal
          imageWithFallback={
            <ImageWithFallback
              src={imageUrl ?? ""}
              alt={data.englishName}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-none border border-stone-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            />
          }
          content={(onClose) => (
            <EditImageForm
              categoryId={data.categoryId}
              initialImageUrl={imageUrl}
              onClose={onClose}
            />
          )}
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-store-heading text-2xl sm:text-3xl font-semibold text-stone-900">{data.englishName}</h1>
            <span className="font-store-body text-xs text-stone-400 border border-stone-200 rounded-none px-2 py-0.5">
              ID: {data.categoryId}
            </span>
          </div>
          <p className="font-store-body text-stone-500 text-sm">{data.spanishName}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label={t("products")} value={data.products} />
        <StatCard label={t("unitsSold")} value={data.unitsSold} />
        <StatCard
          label={t("revenue")}
          value={`$${(data.revenue).toLocaleString()}`}
        />
        <StatCard
          label={t("averagePrice")}
          value={`$${(data.averagePrice).toFixed(2)}`}
        />
        <StatCard
          label={t("stock")}
          value={data.stock}
          warning={isLowStock}
          warningLabel={t("lowStockWarning")}
        />
      </div>

      {/* Product tables */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="font-store-heading text-xl font-semibold text-stone-900 mb-3">{t("topProducts")}</h2>
          <DataTable
            columns={topProductsColumns}
            data={TOP_PRODUCTS_MOCK}
            page={0}
            setPage={() => {}}
            hasNextPage={false}
            loading={false}
            labels={tableLabels}
          />
        </div>

        <div>
          <h2 className="font-store-heading text-xl font-semibold text-stone-900 mb-3">{t("lowStockProducts")}</h2>
          <DataTable
            columns={lowStockColumns}
            data={LOW_STOCK_PRODUCTS_MOCK}
            page={0}
            setPage={() => {}}
            hasNextPage={false}
            loading={false}
            labels={tableLabels}
          />
        </div>
      </div>

      {/* Actions */}
      {data && (
        <div className="flex justify-end gap-3">
          <Modal
            buttonName={<><Pencil className="h-4 w-4" />{t("edit")}</>}
            size="default"
            triggerClassName="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white border-stone-900 hover:border-stone-800 font-store-body"
            content={(onClose) => (
              <EditCategoryForm categoryId={data.categoryId} onClose={onClose} />
            )}
          />
          <DestructiveActionButton onConfirm={handleDelete} size="default" label={t("delete")} />
        </div>
      )}
    </div>
  );
}
