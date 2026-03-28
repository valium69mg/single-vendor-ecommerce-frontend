import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

export interface SidebarDropDownMenuItemProps {
  name: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  icon: ReactNode;
}

export default function GenericDropdownMenuItem({
  name,
  onClick,
  icon,
}: SidebarDropDownMenuItemProps) {
  return (
    <DropdownMenuItem onClick={onClick}>
      {icon}
      <span>{name}</span>
    </DropdownMenuItem>
  );
}

