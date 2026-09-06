import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar/Navbar";
import Loader from "@/components/common/Loader";
import { useUser } from "@/hooks/useUser";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { getOrder } from "@/api/api";
import { formatMXN } from "@/lib/format";
import { formatDate } from "@/lib/formatDate";

interface LocationState {
  justPurchased?: boolean;
}

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const { user } = useUser();
  const { throwOnError } = useApiErrorHandler();

  // Only an explicit `justPurchased: true` from checkout's own navigation
  // shows the banner. Arriving from `/pedidos`, a direct URL, or a refresh
  // all carry no such state, so the banner stays hidden in every one of
  // those cases — never inferred from anything else about the order.
  const justPurchased =
    (location.state as LocationState | null)?.justPurchased === true;

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "detail", orderNumber],
    queryFn: () => getOrder(orderNumber!, user!.token),
    enabled: !!user?.token && !!orderNumber,
    throwOnError,
  });

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <Loader />
        ) : !data ? (
          <div className="flex flex-col items-start gap-4 py-16">
            <p className="font-store-body text-sm text-stone-400">
              {t("order.detail.notFound")}
            </p>
            <Link
              to="/pedidos"
              className="border border-stone-900 px-5 py-2 font-store-body text-sm text-stone-900 transition-colors hover:bg-stone-100"
            >
              {t("order.detail.backToOrders")}
            </Link>
          </div>
        ) : (
          <>
            {justPurchased && (
              <div
                role="status"
                className="mb-6 border border-green-300 bg-green-50 px-4 py-3 font-store-body text-sm text-green-800"
              >
                {t("order.detail.confirmationBanner")}
              </div>
            )}

            <h1 className="mb-1 font-store-heading text-2xl text-stone-900">
              {t("order.detail.title")}
            </h1>
            <p className="mb-6 font-store-body text-sm text-stone-500">
              {data.orderNumber} · {formatDate(data.createdAt)} ·{" "}
              {t(`order.status.${data.status}`, data.status)}
            </p>

            <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
              <div className="flex flex-col gap-4">
                <h2 className="font-store-heading text-lg text-stone-900">
                  {t("order.detail.items")}
                </h2>
                <div className="divide-y divide-stone-100 border border-stone-200 bg-white">
                  {data.items.map((item) => (
                    <div
                      key={item.orderItemId}
                      className="flex items-center justify-between px-4 py-3 font-store-body text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-stone-900">
                          {item.productName}
                        </span>
                        {item.variantLabel && (
                          <span className="text-xs text-stone-500">
                            {item.variantLabel}
                          </span>
                        )}
                        <span className="text-xs text-stone-400">
                          {item.sku} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-semibold text-stone-900">
                        {formatMXN(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <h2 className="mt-4 font-store-heading text-lg text-stone-900">
                  {t("order.detail.shippingAddress")}
                </h2>
                <div className="border border-stone-200 bg-white p-4 font-store-body text-sm text-stone-700">
                  <p className="font-semibold text-stone-900">
                    {data.shippingAddress.recipient}
                  </p>
                  <p>
                    {data.shippingAddress.line1}
                    {data.shippingAddress.line2
                      ? `, ${data.shippingAddress.line2}`
                      : ""}
                  </p>
                  <p>
                    {data.shippingAddress.city}, {data.shippingAddress.state}{" "}
                    {data.shippingAddress.postalCode}
                  </p>
                  <p>{data.shippingAddress.country}</p>
                  <p>{data.shippingAddress.phone}</p>
                </div>
              </div>

              <aside className="h-fit border border-stone-200 bg-white p-5 font-store-body text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span>{t("order.detail.subtotal")}</span>
                  <span>{formatMXN(data.subtotal)}</span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span>{t("order.detail.shippingCost")}</span>
                  <span>{formatMXN(data.shippingCost)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200 pt-2 font-semibold">
                  <span>{t("order.detail.total")}</span>
                  <span>{formatMXN(data.total)}</span>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
