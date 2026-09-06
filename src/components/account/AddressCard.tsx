import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Modal from "@/components/common/Modal";
import DestructiveActionButton from "@/components/common/DestructiveActionButton";
import AddressForm from "@/components/account/AddressForm";
import { deleteAddress, setDefaultAddress } from "@/api/api";
import type { Address } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";

export default function AddressCard({ address }: { address: Address }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAddress(address.addressId, user!.token),
    onSuccess: () => {
      invalidate();
      success(t("account.addresses.deleted"));
    },
    onError: () => error(t("account.addresses.loadError")),
  });

  const defaultMutation = useMutation({
    mutationFn: () => setDefaultAddress(address.addressId, user!.token),
    onSuccess: () => {
      invalidate();
      success(t("account.addresses.defaultSet"));
    },
    onError: () => error(t("account.addresses.loadError")),
  });

  const secondLine = [address.city, address.municipality, address.state]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex flex-col gap-2 border border-stone-200 bg-white p-4">
      {address.isDefault && (
        <span className="w-fit bg-stone-900 px-2 py-0.5 font-store-body text-xs text-white">
          {t("account.addresses.defaultBadge")}
        </span>
      )}

      <p className="font-store-body text-sm text-stone-900">
        {address.street} {address.exteriorNumber}
        {address.interiorNumber ? ` int. ${address.interiorNumber}` : ""}
      </p>
      <p className="font-store-body text-sm text-stone-600">
        {address.neighborhood}, {address.postalCode}
      </p>
      {secondLine && (
        <p className="font-store-body text-sm text-stone-600">{secondLine}</p>
      )}
      <p className="font-store-body text-sm text-stone-600">
        {address.recipientName} · {address.phone}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Modal
          buttonName={t("account.addresses.edit")}
          content={(onClose) => (
            <AddressForm mode="edit" address={address} onClose={onClose} />
          )}
        />
        {!address.isDefault && (
          <button
            type="button"
            onClick={() => defaultMutation.mutate()}
            disabled={defaultMutation.isPending}
            className="border border-stone-600 px-3 py-1.5 font-store-body text-sm text-stone-800 rounded-none hover:bg-stone-100 disabled:opacity-60"
          >
            {t("account.addresses.makeDefault")}
          </button>
        )}
        <DestructiveActionButton
          label={t("account.addresses.delete")}
          onConfirm={() => deleteMutation.mutate()}
        />
      </div>
    </article>
  );
}
