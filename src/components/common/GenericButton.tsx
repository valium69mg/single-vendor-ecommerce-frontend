import { Button } from "@/components/ui/button";

interface GenericButtonProps {
  label: string;
  type: "submit" | "reset" | "button" | undefined;
}

export default function GenericButton({ label, type }: GenericButtonProps) {
  return (
    <Button type={type} className="w-full">
      {label}
    </Button>
  );
}
