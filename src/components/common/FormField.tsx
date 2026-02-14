import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";

interface FormFieldProps {
  labelKey: string;
  inputId: string;
  inputType?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  anchorElement?: React.ReactNode;
}

export default function FormField({
  labelKey,
  inputId,
  inputType = "text",
  inputPlaceholder,
  inputRequired = false,
  anchorElement,
}: FormFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-2">
      <div className="flex items-center">
        <Label htmlFor={inputId}>{t(labelKey)}</Label>
        {anchorElement && (
          <div className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
            {anchorElement}
          </div>
        )}
      </div>
      <Input
        id={inputId}
        type={inputType}
        placeholder={inputPlaceholder}
        required={inputRequired}
      />
    </div>
  );
}
