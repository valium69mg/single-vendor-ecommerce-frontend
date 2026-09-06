import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar/Navbar";
import FormField from "@/components/common/FormField";
import GenericButton from "@/components/common/GenericButton";
import { useCart } from "@/hooks/useCart";
import { useUser } from "@/hooks/useUser";
import { formatMXN } from "@/lib/format";
import { checkoutSchema } from "./checkout.schema";
import type { CheckoutFormValues } from "./checkout.schema";
import { createOrder, CheckoutStockConflictError } from "@/api/api";
import type { StockConflict } from "@/api/api";

type CheckoutStatus = "idle" | "submitting" | "conflict" | "error";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { items, subtotal, updateQty, clear } = useCart();

  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [conflicts, setConflicts] = useState<Map<number, StockConflict>>(
    new Map(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!user || items.length === 0) return;

    setStatus("submitting");
    setErrorMessage(null);
    setConflicts(new Map());

    try {
      const order = await createOrder(
        {
          shippingAddress: {
            recipient: data.recipient,
            line1: data.line1,
            line2: data.line2 || null,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone,
          },
        },
        user.token,
      );

      clear();
      setStatus("idle");
      navigate(`/pedido/${order.orderNumber}`, {
        state: { justPurchased: true },
      });
    } catch (err) {
      if (err instanceof CheckoutStockConflictError) {
        const next = new Map<number, StockConflict>();
        for (const conflict of err.conflicts) {
          next.set(conflict.productVariantId, conflict);
          if (conflict.type === "STOCK_INSUFFICIENT") {
            // Auto-clamp via the real cart mutation (not just local UI
            // state): resubmission always creates the order from the
            // server's current cart, so the fix must land server-side too.
            void updateQty(conflict.productVariantId, conflict.availableStock);
          }
        }
        setConflicts(next);
        setStatus("conflict");
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "order.checkout.genericError",
        );
        setStatus("error");
      }
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-store-heading text-2xl text-stone-900">
          {t("order.checkout.title")}
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-16">
            <p className="font-store-body text-sm text-stone-400">
              {t("order.checkout.emptyCart")}
            </p>
            <Link
              to="/carrito"
              className="border border-stone-900 px-5 py-2 font-store-body text-sm text-stone-900 transition-colors hover:bg-stone-100"
            >
              {t("order.checkout.backToCart")}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-10 lg:grid-cols-[1fr_20rem]"
          >
            <div className="flex flex-col gap-4">
              <h2 className="font-store-heading text-lg text-stone-900">
                {t("order.checkout.shippingSection")}
              </h2>

              {errorMessage && (
                <p
                  role="alert"
                  className="bg-red-50 px-3 py-2 font-store-body text-sm text-red-700"
                >
                  {t(errorMessage)}
                </p>
              )}

              <FormField
                labelKey="order.checkout.recipient"
                inputId="recipient"
                register={register("recipient")}
                error={errors.recipient?.message}
              />
              <FormField
                labelKey="order.checkout.line1"
                inputId="line1"
                register={register("line1")}
                error={errors.line1?.message}
              />
              <FormField
                labelKey="order.checkout.line2"
                inputId="line2"
                register={register("line2")}
                error={errors.line2?.message}
              />
              <FormField
                labelKey="order.checkout.city"
                inputId="city"
                register={register("city")}
                error={errors.city?.message}
              />
              <FormField
                labelKey="order.checkout.state"
                inputId="state"
                register={register("state")}
                error={errors.state?.message}
              />
              <FormField
                labelKey="order.checkout.postalCode"
                inputId="postalCode"
                register={register("postalCode")}
                error={errors.postalCode?.message}
              />
              <FormField
                labelKey="order.checkout.country"
                inputId="country"
                register={register("country")}
                error={errors.country?.message}
              />
              <FormField
                labelKey="order.checkout.phone"
                inputId="phone"
                register={register("phone")}
                error={errors.phone?.message}
              />
            </div>

            <aside className="h-fit border border-stone-200 bg-white p-5">
              <h2 className="mb-4 font-store-heading text-lg text-stone-900">
                {t("order.checkout.summaryTitle")}
              </h2>

              <div className="mb-4 flex flex-col gap-3">
                {items.map((line) => {
                  const conflict = conflicts.get(line.productVariantId);
                  return (
                    <div
                      key={line.productVariantId}
                      className={
                        conflict
                          ? "border border-red-300 bg-red-50 p-2 text-sm"
                          : "text-sm"
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {line.productName} × {line.quantity}
                        </span>
                        <span>{formatMXN(line.unitPrice * line.quantity)}</span>
                      </div>
                      {conflict && (
                        <p role="alert" className="mt-1 text-xs text-red-700">
                          {conflict.type === "PRODUCT_UNAVAILABLE"
                            ? t("order.checkout.conflictProductUnavailable")
                            : t("order.checkout.conflictStockInsufficient", {
                                available: conflict.availableStock,
                              })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mb-4 flex items-center justify-between border-t border-stone-200 pt-3 font-store-body text-sm">
                <span>{t("cart.subtotal")}</span>
                <span className="font-semibold">{formatMXN(subtotal)}</span>
              </div>
              <p className="mb-4 font-store-body text-xs text-stone-500">
                {t("order.checkout.shippingNotice")}
              </p>

              <GenericButton
                label={t("order.checkout.submit")}
                type="submit"
                isLoading={status === "submitting"}
              />
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
