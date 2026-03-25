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
      <CardTitle className="text-xl sm:text-2xl"> {title} </CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : <></>}
    </CardHeader>
  );
}

function FormContent({ children }: FormContentProps) {
  return <CardContent className="p-4 sm:p-6">{children}</CardContent>;
}

function FormFooter({ children }: FormFooterContentProps) {
  return (
    <CardFooter className="flex-col gap-2 p-4 sm:p-6">{children}</CardFooter>
  );
}

export function Form({
  title,
  description,
  content,
  footerContent,
}: FormProps) {
  return (
    <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
      <FormHeader title={title} description={description} />
      <FormContent>{content}</FormContent>
      <FormFooter>{footerContent}</FormFooter>
    </Card>
  );
}
