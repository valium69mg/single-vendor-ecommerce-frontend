import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Label } from "@radix-ui/react-label";
import FormField from "@/components/common/FormField";
import GenericButton from "@/components/common/GenericButton";
import { Input } from "@/components/ui/input";
import { createAddress, updateAddress, lookupPostalCode } from "@/api/api";
import type { Address, AddressInput } from "@/api/api";
import { ApiError } from "@/api/apiFetch";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { addressSchema } from "@/pages/address.schema";
import type { AddressFormValues } from "@/pages/address.schema";

const OTHER = "__other__";
const CP_DEBOUNCE_MS = 500;
const FIVE_DIGITS = /^\d{5}$/;

type CpState = "idle" | "looking-up" | "verified" | "soft-fallback";

interface AddressFormProps {
  mode: "create" | "edit";
  address?: Address;
  onClose: () => void;
}

function toDefaults(address?: Address): AddressFormValues {
  return {
    street: address?.street ?? "",
    exteriorNumber: address?.exteriorNumber ?? "",
    interiorNumber: address?.interiorNumber ?? "",
    recipientName: address?.recipientName ?? "",
    phone: address?.phone ?? "",
    postalCode: address?.postalCode ?? "",
    state: address?.state ?? "",
    municipality: address?.municipality ?? "",
    city: address?.city ?? "",
    neighborhood: address?.neighborhood ?? "",
    referenceNotes: address?.referenceNotes ?? "",
  };
}

export default function AddressForm({ mode, address, onClose }: AddressFormProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: toDefaults(address),
  });

  const [cpState, setCpState] = useState<CpState>(
    address?.cpVerified ? "verified" : "idle",
  );
  const [colonias, setColonias] = useState<string[]>(
    address?.cpVerified && address.neighborhood ? [address.neighborhood] : [],
  );
  const [coloniaChoice, setColoniaChoice] = useState<string>(
    address?.neighborhood ?? "",
  );

  const postalCode = watch("postalCode");
  const lastLookedUp = useRef<string | null>(null);

  useEffect(() => {
    if (!FIVE_DIGITS.test(postalCode)) {
      lastLookedUp.current = null;
      if (cpState !== "idle") setCpState("idle");
      return;
    }
    if (postalCode === lastLookedUp.current) return;

    const handle = setTimeout(() => {
      lastLookedUp.current = postalCode;
      setCpState("looking-up");
      lookupPostalCode(postalCode)
        .then((data) => {
          setValue("state", data.state);
          setValue("municipality", data.municipality);
          setValue("city", data.city ?? "");
          setColonias(data.colonias);
          const current = getValues("neighborhood");
          const match = data.colonias.includes(current) ? current : "";
          setColoniaChoice(match);
          setValue("neighborhood", match);
          setCpState("verified");
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) {
            setCpState("soft-fallback");
            setColonias([]);
          } else {
            setCpState("soft-fallback");
            error(t("account.addresses.form.cpUnverifiedWarning"));
          }
        });
    }, CP_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [postalCode, setValue, getValues, cpState, error, t]);

  const mutation = useMutation({
    mutationFn: (input: AddressInput) =>
      mode === "edit" && address
        ? updateAddress(address.addressId, input, user!.token)
        : createAddress(input, user!.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
      success(
        mode === "edit"
          ? t("account.addresses.updated")
          : t("account.addresses.created"),
      );
      onClose();
    },
    onError: () => error(t("account.addresses.form.cpUnverifiedWarning")),
  });

  const onSubmit = (data: AddressFormValues) => {
    mutation.mutate({
      recipientName: data.recipientName,
      street: data.street,
      exteriorNumber: data.exteriorNumber,
      interiorNumber: data.interiorNumber || undefined,
      neighborhood: data.neighborhood,
      postalCode: data.postalCode,
      city: data.city || undefined,
      state: data.state,
      municipality: data.municipality,
      phone: data.phone,
      referenceNotes: data.referenceNotes || undefined,
    });
  };

  const geoReadOnly = cpState === "verified";
  const showColoniaSelect = cpState === "verified";
  const showColoniaOther = showColoniaSelect && coloniaChoice === OTHER;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-[min(30rem,90vw)] flex-col gap-4 bg-white p-6"
    >
      <h2 className="font-store-heading text-lg text-stone-900">
        {mode === "edit"
          ? t("account.addresses.edit")
          : t("account.addresses.add")}
      </h2>

      <FormField
        labelKey="account.addresses.form.street"
        inputId="addr-street"
        register={register("street")}
        error={errors.street?.message}
      />
      <FormField
        labelKey="account.addresses.form.exteriorNumber"
        inputId="addr-exterior"
        register={register("exteriorNumber")}
        error={errors.exteriorNumber?.message}
      />
      <FormField
        labelKey="account.addresses.form.interiorNumber"
        inputId="addr-interior"
        inputPlaceholder={t("account.addresses.form.interiorNumberHint")}
        register={register("interiorNumber")}
        error={errors.interiorNumber?.message}
      />
      <FormField
        labelKey="account.addresses.form.recipientName"
        inputId="addr-recipient"
        register={register("recipientName")}
        error={errors.recipientName?.message}
      />
      <FormField
        labelKey="account.addresses.form.phone"
        inputId="addr-phone"
        register={register("phone")}
        error={errors.phone?.message}
      />
      <FormField
        labelKey="account.addresses.form.postalCode"
        inputId="addr-postal"
        register={register("postalCode")}
        error={errors.postalCode?.message}
      />

      {cpState === "looking-up" && (
        <p className="font-store-body text-xs text-stone-500">
          {t("account.addresses.form.cpLookingUp")}
        </p>
      )}
      {cpState === "soft-fallback" && (
        <p
          role="alert"
          className="bg-amber-50 px-3 py-2 font-store-body text-xs text-amber-800"
        >
          {t("account.addresses.form.cpUnverifiedWarning")}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="addr-state">
          {t("account.addresses.form.state")}
        </Label>
        <Input
          id="addr-state"
          readOnly={geoReadOnly}
          {...register("state")}
        />
        {errors.state?.message && (
          <p className="text-xs text-red-500">{t(errors.state.message)}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="addr-municipality">
          {t("account.addresses.form.municipality")}
        </Label>
        <Input
          id="addr-municipality"
          readOnly={geoReadOnly}
          {...register("municipality")}
        />
        {errors.municipality?.message && (
          <p className="text-xs text-red-500">
            {t(errors.municipality.message)}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="addr-city">{t("account.addresses.form.city")}</Label>
        <Input
          id="addr-city"
          readOnly={geoReadOnly}
          {...register("city")}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="addr-neighborhood">
          {t("account.addresses.form.neighborhood")}
        </Label>
        {showColoniaSelect ? (
          <select
            id="addr-neighborhood"
            value={coloniaChoice}
            onChange={(e) => {
              const next = e.target.value;
              setColoniaChoice(next);
              setValue("neighborhood", next === OTHER ? "" : next, {
                shouldValidate: true,
              });
            }}
            className="h-9 w-full border border-stone-300 bg-white px-3 font-store-body text-sm rounded-none"
          >
            <option value="">
              {t("account.addresses.form.neighborhood")}
            </option>
            {colonias.map((colonia) => (
              <option key={colonia} value={colonia}>
                {colonia}
              </option>
            ))}
            <option value={OTHER}>
              {t("account.addresses.form.neighborhoodOther")}
            </option>
          </select>
        ) : (
          <Input id="addr-neighborhood" {...register("neighborhood")} />
        )}
        {showColoniaOther && (
          <Input
            id="addr-neighborhood-other"
            aria-label={t("account.addresses.form.neighborhoodOtherLabel")}
            onChange={(e) =>
              setValue("neighborhood", e.target.value, { shouldValidate: true })
            }
          />
        )}
        {errors.neighborhood?.message && (
          <p className="text-xs text-red-500">
            {t(errors.neighborhood.message)}
          </p>
        )}
      </div>

      <FormField
        labelKey="account.addresses.form.referenceNotes"
        inputId="addr-reference"
        register={register("referenceNotes")}
        error={errors.referenceNotes?.message}
      />

      <GenericButton
        label={t("account.addresses.form.submit")}
        type="submit"
        isLoading={mutation.isPending}
      />
    </form>
  );
}
