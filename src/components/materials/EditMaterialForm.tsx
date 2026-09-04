import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import { useToast } from "@/hooks/useToast";
import FormField from "../common/FormField";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { EditMaterialFormValues } from "../auth/edit-material.schema";
import { editMaterialSchema } from "../auth/edit-material.schema";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  StandardResponse,
  EditMaterialMutationVariables,
  AdminMaterial,
} from "@/api/api";
import { editMaterial, getAdminMaterial } from "@/api/api";
import { ApiConflictError } from "@/api/apiFetch";
import GenericButton from "../common/GenericButton";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { useEffect, useState } from "react";
import RestoreMaterialDialog from "./RestoreMaterialDialog";

interface EditMaterialFormContentProps {
  data: AdminMaterial | undefined;
  register: UseFormRegister<EditMaterialFormValues>;
  errors: FieldErrors<EditMaterialFormValues>;
}

function EditMaterialFormContent({
  data,
  register,
  errors,
}: EditMaterialFormContentProps) {
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

interface EditMaterialFormFooterContentProps {
  mutation: UseMutationResult<
    StandardResponse,
    Error,
    EditMaterialMutationVariables
  >;
  isSubmitting: boolean;
}

function EditMaterialFormFooterContent({
  mutation,
  isSubmitting,
}: EditMaterialFormFooterContentProps) {
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

interface EditMaterialFormProps {
  materialId: number;
  onClose: () => void;
}

export default function EditMaterialForm({
  materialId,
  onClose,
}: EditMaterialFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { throwOnError, handleError } = useApiErrorHandler();
  const [conflictMaterialId, setConflictMaterialId] = useState<number | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditMaterialFormValues>({
    resolver: zodResolver(editMaterialSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "material", materialId],
    queryFn: () => getAdminMaterial(materialId, user!.token),
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
    EditMaterialMutationVariables
  >({
    mutationFn: editMaterial,
    onSuccess: (data) => {
      success(data?.message);
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "material", materialId],
      });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiConflictError && err.materialId !== undefined) {
        setConflictMaterialId(err.materialId);
      } else {
        handleError(err, t("materialNotEditedSuccessfully"));
      }
    },
  });

  const onSubmit = (formValues: EditMaterialFormValues) => {
    mutation.mutate({
      data: formValues,
      materialId: materialId,
      token: user?.token || "",
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Form
          title={t("edit") + " " + t("material").toLowerCase()}
          description={t("editMaterialFormDescription")}
          isLoading={isLoading}
          content={
            <EditMaterialFormContent
              data={data}
              register={register}
              errors={errors}
            />
          }
          footerContent={
            <EditMaterialFormFooterContent
              mutation={mutation}
              isSubmitting={isSubmitting}
            />
          }
        />
      </form>

      {conflictMaterialId !== null && (
        <RestoreMaterialDialog
          open={conflictMaterialId !== null}
          onOpenChange={(open) => {
            if (!open) setConflictMaterialId(null);
          }}
          materialId={conflictMaterialId}
          onRestored={() => {
            setConflictMaterialId(null);
            onClose();
          }}
          onUseDifferentName={() => {
            setConflictMaterialId(null);
            setTimeout(() => setFocus("name"), 0);
          }}
        />
      )}
    </>
  );
}
