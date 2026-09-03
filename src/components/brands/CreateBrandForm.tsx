import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import { useToast } from "@/hooks/useToast";
import FormField from "../common/FormField";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CreateBrandFormValues } from "../auth/create-brand.schema";
import { createBrandSchema } from "../auth/create-brand.schema";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StandardResponse, CreateBrandMutationVariables } from "@/api/api";
import { createBrand } from "@/api/api";
import { ApiConflictError } from "@/api/apiFetch";
import GenericButton from "../common/GenericButton";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import RestoreBrandDialog from "./RestoreBrandDialog";

interface CreateBrandFormContentProps {
  register: UseFormRegister<CreateBrandFormValues>;
  errors: FieldErrors<CreateBrandFormValues>;
}

function CreateBrandFormContent({
  register,
  errors,
}: CreateBrandFormContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        labelKey="name"
        inputId="name"
        inputType="text"
        inputPlaceholder=""
        register={register("name")}
        error={errors.name?.message}
      />
    </div>
  );
}

interface CreateBrandFormFooterContentProps {
  mutation: UseMutationResult<
    StandardResponse,
    Error,
    CreateBrandMutationVariables
  >;
  isSubmitting: boolean;
}

function CreateBrandFormFooterContent({
  mutation,
  isSubmitting,
}: CreateBrandFormFooterContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {mutation.isError && (
        <p className="text-sm text-red-500 text-center">
          {t((mutation.error as Error).message)}
        </p>
      )}
      <GenericButton
        label={t("createBrand")}
        type="submit"
        isLoading={isSubmitting || mutation.isPending}
      />
    </>
  );
}

interface CreateBrandFormProps {
  onClose: () => void;
}

export default function CreateBrandForm({ onClose }: CreateBrandFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();
  const [conflictBrandId, setConflictBrandId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateBrandFormValues>({
    resolver: zodResolver(createBrandSchema),
  });

  const mutation = useMutation<
    StandardResponse,
    Error,
    CreateBrandMutationVariables
  >({
    mutationFn: createBrand,
    onSuccess: (data) => {
      success(data?.message || t("brandCreatedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiConflictError && err.brandId !== undefined) {
        setConflictBrandId(err.brandId);
      } else {
        handleError(err, t("brandNotCreatedSuccessfully"));
      }
    },
  });

  const onSubmit = (formValues: CreateBrandFormValues) => {
    mutation.mutate({
      data: formValues,
      token: user?.token || "",
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Form
          title={t("createBrand")}
          description={t("createBrandFormDescription")}
          content={<CreateBrandFormContent register={register} errors={errors} />}
          footerContent={
            <CreateBrandFormFooterContent
              mutation={mutation}
              isSubmitting={isSubmitting}
            />
          }
        />
      </form>

      {conflictBrandId !== null && (
        <RestoreBrandDialog
          open={conflictBrandId !== null}
          onOpenChange={(open) => {
            if (!open) setConflictBrandId(null);
          }}
          brandId={conflictBrandId}
          onRestored={() => {
            setConflictBrandId(null);
            onClose();
          }}
          onUseDifferentName={() => {
            setConflictBrandId(null);
            setTimeout(() => setFocus("name"), 0);
          }}
        />
      )}
    </>
  );
}
