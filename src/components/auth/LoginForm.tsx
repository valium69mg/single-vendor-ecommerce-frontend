import { Form } from "../common/Form";
import { useTranslation } from "react-i18next";
import FormField from "../common/FormField";
import GenericButton from "../common/GenericButton";

function LoginFormContent() {
  const { t } = useTranslation();

  return (
    <form>
      <div className="flex flex-col gap-6">
        <FormField
          labelKey="email"
          inputId="email"
          inputType="email"
          inputPlaceholder="m@example.com"
          inputRequired
        />
        <FormField
          labelKey="password"
          inputId="password"
          inputType="password"
          inputRequired
          anchorElement={<a href="#">{t("forgotYourPassword")}</a>}
        />
      </div>
    </form>
  );
}

function LoginFormFooterContent() {
  const { t } = useTranslation();
  return <GenericButton label={t("login")} type="submit" />;
}

export default function LoginForm() {
  const { t } = useTranslation();

  return (
    <>
      <Form
        title={t("welcome")}
        description={t("loginFormDescription")}
        content={<LoginFormContent />}
        footerContent={<LoginFormFooterContent />}
      ></Form>
    </>
  );
}
