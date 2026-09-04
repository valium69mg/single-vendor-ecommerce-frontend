import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import { useToast } from "@/hooks/useToast";
import FormField from "../common/FormField";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CreateMaterialFormValues } from "../auth/create-material.schema";
import { createMaterialSchema } from "../auth/create-material.schema";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  StandardResponse,
  CreateMaterialMutationVariables,
} from "@/api/api";
import { createMaterial } from "@/api/api";
import { ApiConflictError } from "@/api/apiFetch";
import GenericButton from "../common/GenericButton";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import RestoreMaterialDialog from "./RestoreMaterialDialog";

interface CreateMaterialFormContentProps {
  register: UseFormRegister<CreateMaterialFormValues>;
  errors: FieldErrors<CreateMaterialFormValues>;
}

function CreateMaterialFormContent({
  register,
  errors,
}: CreateMaterialFormContentProps) {
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

interface CreateMaterialFormFooterContentProps {
  mutation: UseMutationResult<
    StandardResponse,
    Error,
    CreateMaterialMutationVariables
  >;
  isSubmitting: boolean;
}

function CreateMaterialFormFooterContent({
  mutation,
  isSubmitting,
}: CreateMaterialFormFooterContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {mutation.isError && (
        <p className="text-sm text-red-500 text-center">
          {t((mutation.error as Error).message)}
        </p>
      )}
      <GenericButton
        label={t("createMaterial")}
        type="submit"
        isLoading={isSubmitting || mutation.isPending}
      />
    </>
  );
}

interface CreateMaterialFormProps {
  onClose: () => void;
}

export default function CreateMaterialForm({
  onClose,
}: CreateMaterialFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();
  const [conflictMaterialId, setConflictMaterialId] = useState<number | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaterialFormValues>({
    resolver: zodResolver(createMaterialSchema),
  });

  const mutation = useMutation<
    StandardResponse,
    Error,
    CreateMaterialMutationVariables
  >({
    mutationFn: createMaterial,
    onSuccess: (data) => {
      success(data?.message || t("materialCreatedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiConflictError && err.materialId !== undefined) {
        setConflictMaterialId(err.materialId);
      } else {
        handleError(err, t("materialNotCreatedSuccessfully"));
      }
    },
  });

  const onSubmit = (formValues: CreateMaterialFormValues) => {
    mutation.mutate({
      data: formValues,
      token: user?.token || "",
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Form
          title={t("createMaterial")}
          description={t("createMaterialFormDescription")}
          content={
            <CreateMaterialFormContent register={register} errors={errors} />
          }
          footerContent={
            <CreateMaterialFormFooterContent
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
