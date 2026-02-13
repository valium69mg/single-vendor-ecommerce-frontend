import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";

function Header() {
  return <h1>{t("welcome")}</h1>;
}

interface FormProps {
  headerContent?: React.ReactNode;
  content?: React.ReactNode;
  footerContent?: React.ReactNode;
}

interface FormContentProps {
  children: React.ReactNode;
}
function FormHeader() {
  const { t } = useTranslation();

  return (
    <CardHeader>
      <CardTitle> {t("welcome")}, Login to your account</CardTitle>
      <CardDescription>
        Enter your email below to login to your account
      </CardDescription>
      <CardAction>
        <Button variant="link">Sign Up</Button>
      </CardAction>
    </CardHeader>
  );
}

function FormContent({ children }: FormContentProps) {
  return <CardContent>{children}</CardContent>;
}

function FormFooter() {
  return (
    <CardFooter className="flex-col gap-2">
      <Button type="submit" className="w-full">
        Login
      </Button>
    </CardFooter>
  );
}

export function Form({ headerContent, content, footerContent }: FormProps) {
  return (
    <Card className="w-full max-w-sm">
      <FormHeader></FormHeader>
      <FormContent>{content}</FormContent>
      <FormFooter></FormFooter>
    </Card>
  );
}
