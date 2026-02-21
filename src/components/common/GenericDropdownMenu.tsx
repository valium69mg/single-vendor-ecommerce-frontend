import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { GenericDropDownMenuItemProps } from "./GenericDropdownMenuItem";
import GenericDropdownMenuItem from "./GenericDropdownMenuItem";

interface GenericDropdownMenuProps {
  side?: "top" | "bottom" | "left" | "right";
  avatarSrc?: string;
  title: string;
  items: GenericDropDownMenuItemProps[];
}

export default function GenericDropdownMenu({
  side = "bottom",
  avatarSrc,
  title,
  items,
}: GenericDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="flex items-center gap-2 rounded-md hover:bg-muted">
          {/* Avatar (optional) */}
          {avatarSrc && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarSrc} alt={`${title} avatar`} />
              <AvatarFallback>{title.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}

          {/* Title */}
          <span className="text-sm font-medium">{title}</span>

          {/* Trigger icon */}
          <MoreVertical className="ml-auto h-4 w-4 text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} className="w-40">
        {items.map((item) => (
          <GenericDropdownMenuItem
            key={item.name}
            name={item.name}
            icon={item.icon}
            onClick={item.onClick}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
