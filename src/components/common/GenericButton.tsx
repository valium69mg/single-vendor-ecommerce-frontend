import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface GenericButtonProps {
  label: string;
  type: "submit" | "reset" | "button" | undefined;
  isLoading?: boolean;
}

export default function GenericButton({
  label,
  type,
  isLoading = false,
}: GenericButtonProps) {
  return (
    <Button
      type={type}
      className="w-full flex justify-center items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white rounded-none h-11 font-store-body text-sm tracking-wide"
      disabled={isLoading}
    >
      {isLoading && <Spinner className="w-5 h-5" />}
      {label}
    </Button>
  );
}
