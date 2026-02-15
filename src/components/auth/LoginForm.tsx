import { Form } from "../common/Form";
import { useTranslation } from "react-i18next";
import FormField from "../common/FormField";
import GenericButton from "../common/GenericButton";
import { useForm } from "react-hook-form";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "./login.schema";
import type { LoginFormValues } from "./login.schema";
import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "../../api/api";
import type { LoginResponse } from "../../api/api";

interface LoginFormContentProps {
  register: UseFormRegister<LoginFormValues>;
  errors: FieldErrors<LoginFormValues>;
}

function LoginFormContent({ register, errors }: LoginFormContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        labelKey="email"
        inputId="email"
        inputType="email"
        inputPlaceholder="m@example.com"
        inputRequired
        register={register("email")}
        error={errors.email?.message}
      />
      <FormField
        labelKey="password"
        inputId="password"
        inputType="password"
        inputRequired
        register={register("password")}
        anchorElement={<a href="#">{t("forgotYourPassword")}</a>}
      />
    </div>
  );
}

export default function LoginForm() {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation<LoginResponse, Error, LoginFormValues>({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      localStorage.setItem("loginDate", JSON.stringify(data));
      // redirigir a otra accion
    },
  });

  const onSubmit = (data: LoginFormValues) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Form
        title={t("welcome")}
        description={t("loginFormDescription")}
        content={<LoginFormContent register={register} errors={errors} />}
        footerContent={
          <>
            {mutation.isError && (
              <p className="text-sm text-red-500 text-center">
                {t((mutation.error as Error).message)}
              </p>
            )}
            <GenericButton
              label={t("login")}
              type="submit"
              isLoading={isSubmitting || mutation.isPending}
            />
          </>
        }
      />
    </form>
  );
}
