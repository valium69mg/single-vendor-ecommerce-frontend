import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getFileUrl, uploadProfileImage } from "@/api/api";
import type { UserProfile } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";

const MAX_IMAGE_BYTES = 5_000_000;

/**
 * Avatar + file picker. Shows the stored thumbnail (or the shared placeholder
 * via `getFileUrl(null)`), a local `createObjectURL` preview after selection,
 * and pushes the confirmed upload result straight into the `["account","me"]`
 * cache so the page reflects the new photo without a refetch.
 */
export default function ProfilePhotoWidget({ profile }: { profile: UserProfile }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const mutation = useMutation({
    mutationFn: (file: File) => uploadProfileImage(file, user!.token),
    onSuccess: (updated) => {
      queryClient.setQueryData(["account", "me"], updated);
      success(t("account.profile.photo.uploaded"));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
    },
    onError: () => error(t("account.profile.photo.error")),
  });

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error(t("account.profile.photo.invalidType"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      error(t("account.profile.photo.tooLarge"));
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const displaySrc = previewUrl ?? getFileUrl(profile.profileImageThumbnailUrl);

  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="font-store-heading text-lg text-stone-900">
        {t("account.profile.photo.heading")}
      </h2>

      <img
        src={displaySrc}
        alt={t("account.profile.photo.preview")}
        className="h-28 w-28 rounded-none border border-stone-200 object-cover"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={t("account.profile.photo.choose")}
        onChange={handleSelect}
        className="font-store-body text-sm"
      />

      {selectedFile && (
        <button
          type="button"
          onClick={() => mutation.mutate(selectedFile)}
          disabled={mutation.isPending}
          className="bg-stone-900 px-4 py-2 font-store-body text-sm text-white rounded-none hover:bg-stone-800 disabled:opacity-60"
        >
          {mutation.isPending
            ? t("account.profile.photo.uploading")
            : t("account.profile.photo.confirm")}
        </button>
      )}
    </section>
  );
}
