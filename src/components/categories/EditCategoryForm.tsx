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
  Category,
} from "@/api/api";
import { editCategory, getAdminCategory } from "@/api/api";
import { ApiConflictError } from "@/api/apiFetch";
import GenericButton from "../common/GenericButton";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { useEffect, useState } from "react";
import RestoreCategoryDialog from "./RestoreCategoryDialog";

interface EditCategoryFormContentProps {
  data: Category | undefined;
  register: UseFormRegister<EditCategoryFormValues>;
  errors: FieldErrors<EditCategoryFormValues>;
}

function EditCategoryFormContent({
  data,
  register,
  errors,
}: EditCategoryFormContentProps) {
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
  const { throwOnError, handleError } = useApiErrorHandler();
  const [conflictCategoryId, setConflictCategoryId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "category", categoryId],
    queryFn: () => getAdminCategory(categoryId, user!.token),
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
    EditCategoryMutationVariables
  >({
    mutationFn: editCategory,
    onSuccess: (data) => {
      success(data?.message);
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "category", categoryId] });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiConflictError) {
        setConflictCategoryId(err.categoryId);
      } else {
        handleError(err, t("categoryNotEditedSuccessfully"));
      }
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
    <>
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
