import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import { useToast } from "@/hooks/useToast";
import FormField from "../common/FormField";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { EditCategoryFormValues } from "../auth/edit-category.schema";
import { editCategorySchema } from "../auth/edit-category.schema";
import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  StandardResponse,
  EditCategoryMutationVariables,
  CategoryById,
} from "@/api/api";
import { editCategory, getCategory } from "@/api/api";
import GenericButton from "../common/GenericButton";
import US from "country-flag-icons/react/3x2/US";
import MX from "country-flag-icons/react/3x2/MX";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { useEffect, useState } from "react";

interface EditCategoryFormContentProps {
  data: CategoryById | undefined;
  register: UseFormRegister<EditCategoryFormValues>;
  errors: FieldErrors<EditCategoryFormValues>;
}

function EditCategoryFormContent({
  data,
  register,
  errors,
}: EditCategoryFormContentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <FormField
        labelKey="englishName"
        labelIcon={<US className="w-4 h-4" />}
        inputId="englishName"
        inputType="text"
        inputPlaceholder=""
        register={register("englishName")}
        error={errors.englishName?.message}
      />
      <FormField
        labelKey="spanishName"
        labelIcon={<MX className="w-4 h-4" />}
        inputId="spanishName"
        inputType="text"
        inputPlaceholder=""
        register={register("spanishName")}
        error={errors.spanishName?.message}
      />
    </div>
  );
}

interface EditCategoryFormFooterContentProps {
  mutation: UseMutationResult<
    StandardResponse,
    Error,
    EditCategoryMutationVariables
  >;
  isSubmitting: boolean;
}

function EditCategoryFormFooterContent({
  mutation,
  isSubmitting,
}: EditCategoryFormFooterContentProps) {
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

interface EditCategoryFormProps {
  categoryId: number;
  onClose: () => void;
}

export default function EditCategoryForm({
  categoryId,
  onClose,
}: EditCategoryFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { throwOnError } = useApiErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => getCategory(categoryId, user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  useEffect(() => {
    if (data) {
      reset({
        englishName: data.englishName,
        spanishName: data.spanishName,
      });
    }
  }, [data, reset]);

  const mutation = useMutation<
    StandardResponse,
    Error,
    EditCategoryMutationVariables
  >({
    mutationFn: editCategory,
    onSuccess: (data) => {
      success(data?.message);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
  });

  const onSubmit = (formValues: EditCategoryFormValues) => {
    mutation.mutate({
      data: formValues,
      categoryId: categoryId,
      token: user?.token || "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Form
        title={t("edit") + " " + t("category").toLowerCase()}
        description={t("editCategoryFormDescription")}
        isLoading={isLoading}
        content={
          <EditCategoryFormContent
            data={data}
            register={register}
            errors={errors}
          />
        }
        footerContent={
          <EditCategoryFormFooterContent
            mutation={mutation}
            isSubmitting={isSubmitting}
          />
        }
      />
    </form>
  );
}
