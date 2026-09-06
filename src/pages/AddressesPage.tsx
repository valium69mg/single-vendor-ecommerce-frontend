import { useTranslation } from "react-i18next";

/**
 * Placeholder shipped in WU3 so the `/mi-cuenta/direcciones` route resolves.
 * WU4 replaces this with the full address book (list + form + postal-code
 * lookup).
 */
export default function AddressesPage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-store-heading text-lg text-stone-900">
        {t("account.addresses.heading")}
      </h2>
      <p className="font-store-body text-sm text-stone-400">
        {t("account.addresses.empty")}
      </p>
    </section>
  );
}
