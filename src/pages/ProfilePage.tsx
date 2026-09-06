import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Label } from "@radix-ui/react-label";
import FormField from "@/components/common/FormField";
import GenericButton from "@/components/common/GenericButton";
import Loader from "@/components/common/Loader";
import { Input } from "@/components/ui/input";
import ProfilePhotoWidget from "@/components/account/ProfilePhotoWidget";
import { getMe, updateMe } from "@/api/api";
import type { UpdateProfilePayload } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { useToast } from "@/hooks/useToast";
import { profileSchema } from "./profile.schema";
import type { ProfileFormValues } from "./profile.schema";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError } = useApiErrorHandler();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["account", "me"],
    queryFn: () => getMe(user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? "",
      paternalLastName: profile?.paternalLastName ?? "",
      maternalLastName: profile?.maternalLastName ?? "",
      phone: profile?.phone ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMe(payload, user!.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", "me"] });
      success(t("account.profile.saved"));
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    mutation.mutate({
      firstName: data.firstName,
      paternalLastName: data.paternalLastName,
      maternalLastName: data.maternalLastName,
      phone: data.phone,
    });
  };

  if (isLoading || !profile) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-w-md flex-1 flex-col gap-4"
      >
        <h2 className="font-store-heading text-lg text-stone-900">
          {t("account.profile.heading")}
        </h2>

        <FormField
          labelKey="account.profile.firstName"
          inputId="firstName"
          register={register("firstName")}
          error={errors.firstName?.message}
        />
        <FormField
          labelKey="account.profile.paternalLastName"
          inputId="paternalLastName"
          register={register("paternalLastName")}
          error={errors.paternalLastName?.message}
        />
        <FormField
          labelKey="account.profile.maternalLastName"
          inputId="maternalLastName"
          register={register("maternalLastName")}
          error={errors.maternalLastName?.message}
        />
        <FormField
          labelKey="account.profile.phone"
          inputId="phone"
          register={register("phone")}
          error={errors.phone?.message}
        />

        <div className="grid gap-2">
          <Label htmlFor="email">{t("account.profile.email")}</Label>
          <Input id="email" value={profile.email} disabled readOnly />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">{t("account.profile.username")}</Label>
          <Input id="username" value={profile.username} disabled readOnly />
        </div>

        <GenericButton
          label={t("account.profile.save")}
          type="submit"
          isLoading={mutation.isPending}
        />
      </form>

      <ProfilePhotoWidget profile={profile} />
    </div>
  );
}
