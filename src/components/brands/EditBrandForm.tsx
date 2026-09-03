import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import { useToast } from "@/hooks/useToast";
import FormField from "../common/FormField";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { EditBrandFormValues } from "../auth/edit-brand.schema";
import { editBrandSchema } from "../auth/edit-brand.schema";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  StandardResponse,
  EditBrandMutationVariables,
  AdminBrandById,
} from "@/api/api";
import { editBrand, getAdminBrand } from "@/api/api";
import { ApiConflictError } from "@/api/apiFetch";
import GenericButton from "../common/GenericButton";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { useEffect, useState } from "react";
import RestoreBrandDialog from "./RestoreBrandDialog";

interface EditBrandFormContentProps {
  data: AdminBrandById | undefined;
  register: UseFormRegister<EditBrandFormValues>;
  errors: FieldErrors<EditBrandFormValues>;
}

function EditBrandFormContent({
  data,
  register,
  errors,
}: EditBrandFormContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        key={data?.name}
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

interface EditBrandFormFooterContentProps {
  mutation: UseMutationResult<
    StandardResponse,
    Error,
    EditBrandMutationVariables
  >;
  isSubmitting: boolean;
}

function EditBrandFormFooterContent({
  mutation,
  isSubmitting,
}: EditBrandFormFooterContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {mutation.isError && (
        <p className="text-sm text-red-500 text-center">
          {t((mutation.error as Error).message)}
        </p>
      )}
      <GenericButton
        label={t("edit")}
        type="submit"
        isLoading={isSubmitting || mutation.isPending}
      />
    </>
  );
}

interface EditBrandFormProps {
  brandId: number;
  onClose: () => void;
}

export default function EditBrandForm({ brandId, onClose }: EditBrandFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { throwOnError, handleError } = useApiErrorHandler();
  const [conflictBrandId, setConflictBrandId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditBrandFormValues>({
    resolver: zodResolver(editBrandSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "brand", brandId],
    queryFn: () => getAdminBrand(brandId, user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
      });
    }
  }, [data, reset]);

  const mutation = useMutation<
    StandardResponse,
    Error,
    EditBrandMutationVariables
  >({
    mutationFn: editBrand,
    onSuccess: (data) => {
      success(data?.message);
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "brand", brandId] });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiConflictError && err.brandId !== undefined) {
        setConflictBrandId(err.brandId);
      } else {
        handleError(err, t("brandNotEditedSuccessfully"));
      }
    },
  });

  const onSubmit = (formValues: EditBrandFormValues) => {
    mutation.mutate({
      data: formValues,
      brandId: brandId,
      token: user?.token || "",
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Form
          title={t("edit") + " " + t("brand").toLowerCase()}
          description={t("editBrandFormDescription")}
          isLoading={isLoading}
          content={
            <EditBrandFormContent
              data={data}
              register={register}
              errors={errors}
            />
          }
          footerContent={
            <EditBrandFormFooterContent
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
