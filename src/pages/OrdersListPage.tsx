import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar/Navbar";
import Loader from "@/components/common/Loader";
import { useUser } from "@/hooks/useUser";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { getMyOrders } from "@/api/api";
import { formatMXN } from "@/lib/format";
import { formatDate } from "@/lib/formatDate";

export default function OrdersListPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError } = useApiErrorHandler();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "list"],
    queryFn: () => getMyOrders(user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-store-heading text-2xl text-stone-900">
          {t("order.history.title")}
        </h1>

        {isLoading ? (
          <Loader />
        ) : !data || data.length === 0 ? (
          <p className="font-store-body text-sm text-stone-400">
            {t("order.history.empty")}
          </p>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-200 bg-white">
            {data.map((order) => (
              <Link
                key={order.orderNumber}
                to={`/pedido/${order.orderNumber}`}
                className="flex items-center justify-between px-4 py-4 font-store-body text-sm transition-colors hover:bg-stone-50"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-stone-900">
                    {t("order.history.orderNumber")} {order.orderNumber}
                  </span>
                  <span className="text-xs text-stone-500">
                    {formatDate(order.createdAt)} ·{" "}
                    {t(`order.status.${order.status}`, order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-stone-900">
                    {formatMXN(order.total)}
                  </span>
                  <span className="text-xs text-stone-500 underline">
                    {t("order.history.viewDetail")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
