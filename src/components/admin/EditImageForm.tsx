import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "../common/Form";
import GenericButton from "../common/GenericButton";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { useWatch } from "react-hook-form";
import type { UseFormRegister } from "react-hook-form";
import { uploadCategoryImage } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

interface EditImageFormValues {
  image: FileList;
}

interface EditImageFormProps {
  categoryId: number;
  initialImageUrl?: string;
  onClose: () => void;
}

function EditImageFormContent({
  preview,
  register,
}: {
  preview: string;
  register: UseFormRegister<EditImageFormValues>;
}) {
  return (
    <div className="flex flex-col items-center gap-6 w-full sm:w-96 md:w-[28rem]">
      <img
        src={preview}
        alt="preview"
        className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-xl border-2 border-dashed border-gray-300 shadow-sm"
      />

      <label className="flex flex-col items-center gap-2 cursor-pointer w-full">
        <div className="w-full flex items-center justify-center px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-sm text-gray-500 hover:text-gray-600">
          <span>Click to upload image</span>
        </div>
        <input
          type="file"
          accept="image/*"
          {...register("image")}
          className="sr-only"
        />
      </label>
    </div>
  );
}

function EditImageFormFooter({
  isSubmitting,
  isPending,
}: {
  isSubmitting: boolean;
  isPending: boolean;
}) {
  const { t } = useTranslation();

  return (
    <GenericButton
      label={t("upload")}
      type="submit"
      isLoading={isSubmitting || isPending}
    />
  );
}

export default function EditImageForm({
  categoryId,
  initialImageUrl,
  onClose,
}: EditImageFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<EditImageFormValues>();

  const imageFile = useWatch({
    control,
    name: "image",
  });

  const previewUrl = useMemo(() => {
    if (imageFile && imageFile.length > 0) {
      return URL.createObjectURL(imageFile[0]);
    }
    return initialImageUrl || "/images/landscape-placeholder.svg";
  }, [imageFile, initialImageUrl]);

  useEffect(() => {
    if (!imageFile || imageFile.length === 0) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl, imageFile]);

  const mutation = useMutation({
    mutationFn: async (file: File) =>
      uploadCategoryImage({
        categoryId: categoryId,
        file: file,
        token: user?.token || "",
      }),
    onSuccess: () => {
      success(t("imageUploaded"));

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });

      onClose();
    },
  });

  const onSubmit = (data: EditImageFormValues) => {
    const file = data.image?.[0];
    if (!file) return;

    mutation.mutate(file);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Form
        title={t("uploadImage")}
        description={t("uploadImageDescription")}
        content={
          <EditImageFormContent preview={previewUrl} register={register} />
        }
        footerContent={
          <EditImageFormFooter
            isSubmitting={isSubmitting}
            isPending={mutation.isPending}
          />
        }
      />
    </form>
  );
}
