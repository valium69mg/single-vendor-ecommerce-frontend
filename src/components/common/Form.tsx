import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormProps {
  title: string;
  description?: string;
  content?: React.ReactNode;
  footerContent?: React.ReactNode;
}

interface FormContentProps {
  children: React.ReactNode;
}

interface FormHeaderProps {
  title: string;
  description?: string;
}

interface FormFooterContentProps {
  children: React.ReactNode;
}

function FormHeader({ title, description }: FormHeaderProps) {
  return (
    <CardHeader>
      <CardTitle> {title} </CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : <></>}
    </CardHeader>
  );
}

function FormContent({ children }: FormContentProps) {
  return <CardContent>{children}</CardContent>;
}

function FormFooter({ children }: FormFooterContentProps) {
  return <CardFooter className="flex-col gap-2">{children}</CardFooter>;
}

export function Form({
  title,
  description,
  content,
  footerContent,
}: FormProps) {
  return (
    <Card className="w-full max-w-sm">
      <FormHeader title={title} description={description} />
      <FormContent>{content}</FormContent>
      <FormFooter>{footerContent}</FormFooter>
    </Card>
  );
}
