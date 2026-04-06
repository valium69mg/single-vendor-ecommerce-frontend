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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  StandardResponse,
  EditCategoryMutationVariables,
} from "@/api/api";
import { editCategory } from "@/api/api";
import GenericButton from "../common/GenericButton";

interface EditCategoryFormContentProps {
  register: UseFormRegister<EditCategoryFormValues>;
  errors: FieldErrors<EditCategoryFormValues>;
}

function EditCategoryFormContent({
  register,
  errors,
}: EditCategoryFormContentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <FormField
        labelKey="englishName"
        inputId="englishName"
        inputType="text"
        inputPlaceholder=""
        register={register("englishName")}
        error={errors.englishName?.message}
      />
      <FormField
        labelKey="spanishName"
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
  });

  const mutation = useMutation<
    StandardResponse,
    Error,
    EditCategoryMutationVariables
  >({
    mutationFn: editCategory,
    onSuccess: (data) => {
      success(data?.message);
      queryClient.clear();
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
        content={
          <EditCategoryFormContent register={register} errors={errors} />
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
