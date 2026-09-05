import { Form } from "../common/Form";
import { useTranslation } from "react-i18next";
import FormField from "../common/FormField";
import GenericButton from "../common/GenericButton";
import { useForm } from "react-hook-form";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "./register.schema";
import type { RegisterFormValues } from "./register.schema";
import { useMutation } from "@tanstack/react-query";
import { registerRequest } from "../../api/api";
import type { UseMutationResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";

interface RegisterFormContentProps {
  register: UseFormRegister<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}

interface RegisterFormFooterContentProps {
  mutation: UseMutationResult<void, Error, RegisterFormValues>;
  isSubmitting: boolean;
}

function RegisterFormContent({ register, errors }: RegisterFormContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        labelKey="email"
        inputId="email"
        inputType="email"
        inputPlaceholder="m@example.com"
        register={register("email")}
        error={errors.email?.message}
      />
      <FormField
        labelKey="password"
        inputId="password"
        inputType="password"
        register={register("password")}
        error={errors.password?.message}
      />
      <FormField
        labelKey="auth.register.confirmPasswordLabel"
        inputId="confirmPassword"
        inputType="password"
        register={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <input
            id="acceptTerms"
            type="checkbox"
            className="h-4 w-4 rounded-none border-stone-300"
            {...register("acceptTerms")}
          />
          <label htmlFor="acceptTerms" className="text-sm text-stone-700">
            {t("auth.register.termsLabel")}
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs sm:text-sm text-red-500">
            {t(errors.acceptTerms.message as string)}
          </p>
        )}
      </div>
    </div>
  );
}

function RegisterFormFooterContent({
  mutation,
  isSubmitting,
}: RegisterFormFooterContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {mutation.isError && (
        <p className="text-sm text-red-500 text-center">
          {t((mutation.error as Error).message)}
        </p>
      )}
      <GenericButton
        label={t("auth.register.submit")}
        type="submit"
        isLoading={isSubmitting || mutation.isPending}
      />
    </>
  );
}

interface RegisterFormProps {
  onRegistered: (email: string, password: string) => void;
}

export default function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation<void, Error, RegisterFormValues>({
    mutationFn: (data) =>
      registerRequest({ email: data.email, password: data.password }),
    onSuccess: (_data, variables) => {
      // Hands off to `useRegisterFlow`, which performs a background login
      // and branches to the verify screen or the logged-in landing based on
      // `isVerified` (see `RegisterPage`).
      success(t("auth.register.success"));
      onRegistered(variables.email, variables.password);
    },
  });

  const onSubmit = (data: RegisterFormValues) => mutation.mutate(data);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm sm:max-w-md lg:max-w-lg"
    >
      <Form
        title={t("auth.register.title")}
        description={t("auth.register.description")}
        content={<RegisterFormContent register={register} errors={errors} />}
        footerContent={
          <RegisterFormFooterContent
            mutation={mutation}
            isSubmitting={isSubmitting}
          />
        }
      />
    </form>
  );
}
