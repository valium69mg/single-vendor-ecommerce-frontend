import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Modal from "@/components/common/Modal";
import Loader from "@/components/common/Loader";
import AddressForm from "@/components/account/AddressForm";
import AddressCard from "@/components/account/AddressCard";
import { listAddresses } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

export default function AddressesPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError } = useApiErrorHandler();

  const { data, isLoading } = useQuery({
    queryKey: ["account", "addresses"],
    queryFn: () => listAddresses(user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-store-heading text-lg text-stone-900">
          {t("account.addresses.heading")}
        </h2>
        <Modal
          buttonName={t("account.addresses.add")}
          content={(onClose) => (
            <AddressForm mode="create" onClose={onClose} />
          )}
        />
      </div>

      {isLoading ? (
        <Loader />
      ) : !data || data.length === 0 ? (
        <p className="font-store-body text-sm text-stone-400">
          {t("account.addresses.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((address) => (
            <AddressCard key={address.addressId} address={address} />
          ))}
        </div>
      )}
    </section>
  );
}
