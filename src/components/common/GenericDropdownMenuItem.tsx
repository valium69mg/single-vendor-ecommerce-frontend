import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

export interface GenericDropDownMenuItemProps {
  name: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  icon: ReactNode;
}

export default function GenericDropdownMenuItem({
  name,
  onClick,
  icon,
}: GenericDropDownMenuItemProps) {
  return (
    <DropdownMenuItem onClick={onClick}>
      {icon}
      <span>{name}</span>
    </DropdownMenuItem>
  );
}

