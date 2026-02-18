import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";

interface FormFieldProps {
  labelKey: string;
  inputId: string;
  inputType?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  anchorElement?: React.ReactNode;
  register?: UseFormRegisterReturn;
  error?: string;
}

export default function FormField({
  labelKey,
  inputId,
  inputType = "text",
  inputPlaceholder,
  inputRequired = false,
  anchorElement,
  register,
  error,
}: FormFieldProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = inputType === "password";
  const effectiveType = isPasswordField && showPassword ? "text" : inputType;

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
      <div className="relative">
        <Input
          id={inputId}
          type={effectiveType}
          placeholder={inputPlaceholder}
          required={inputRequired}
          {...(register ?? {})}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-2 text-gray-500"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{t(error)}</p>}
    </div>
  );
}
