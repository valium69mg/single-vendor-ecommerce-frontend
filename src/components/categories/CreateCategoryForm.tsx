import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import { useToast } from "@/hooks/useToast";
import FormField from "../common/FormField";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CreateCategoryFormValues } from "../auth/create-category.schema";
import { createCategorySchema } from "../auth/create-category.schema";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StandardResponse, CreateCategoryMutationVariables } from "@/api/api";
import { createCategory } from "@/api/api";
import { ApiConflictError } from "@/api/apiFetch";
import GenericButton from "../common/GenericButton";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import RestoreCategoryDialog from "./RestoreCategoryDialog";

interface CreateCategoryFormContentProps {
  register: UseFormRegister<CreateCategoryFormValues>;
  errors: FieldErrors<CreateCategoryFormValues>;
}

function CreateCategoryFormContent({
  register,
  errors,
}: CreateCategoryFormContentProps) {
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

interface CreateCategoryFormFooterContentProps {
  mutation: UseMutationResult<
    StandardResponse,
    Error,
    CreateCategoryMutationVariables
  >;
  isSubmitting: boolean;
}

function CreateCategoryFormFooterContent({
  mutation,
  isSubmitting,
}: CreateCategoryFormFooterContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {mutation.isError && (
        <p className="text-sm text-red-500 text-center">
          {t((mutation.error as Error).message)}
        </p>
      )}
      <GenericButton
        label={t("createCategory")}
        type="submit"
        isLoading={isSubmitting || mutation.isPending}
      />
    </>
  );
}

interface CreateCategoryFormProps {
  onClose: () => void;
}

export default function CreateCategoryForm({ onClose }: CreateCategoryFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();
  const [conflictCategoryId, setConflictCategoryId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
  });

  const mutation = useMutation<
    StandardResponse,
    Error,
    CreateCategoryMutationVariables
  >({
    mutationFn: createCategory,
    onSuccess: (data) => {
      success(data?.message || t("categoryCreatedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiConflictError) {
        setConflictCategoryId(err.categoryId);
      } else {
        handleError(err, t("categoryNotCreatedSuccessfully"));
      }
    },
  });

  const onSubmit = (formValues: CreateCategoryFormValues) => {
    mutation.mutate({
      data: formValues,
      token: user?.token || "",
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Form
          title={t("createCategory")}
          description={t("createCategoryFormDescription")}
          content={
            <CreateCategoryFormContent register={register} errors={errors} />
          }
          footerContent={
            <CreateCategoryFormFooterContent
              mutation={mutation}
              isSubmitting={isSubmitting}
            />
          }
        />
      </form>

      {conflictCategoryId !== null && (
        <RestoreCategoryDialog
          open={conflictCategoryId !== null}
          onOpenChange={(open) => {
            if (!open) setConflictCategoryId(null);
          }}
          categoryId={conflictCategoryId}
          onRestored={() => {
            setConflictCategoryId(null);
            onClose();
          }}
          onUseDifferentName={() => {
            setConflictCategoryId(null);
            setTimeout(() => setFocus("name"), 0);
          }}
        />
      )}
    </>
  );
}
