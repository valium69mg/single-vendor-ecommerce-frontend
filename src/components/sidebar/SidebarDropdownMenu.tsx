import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { MdMoreVert } from "react-icons/md";
import type { SidebarDropDownMenuItemProps } from "../sidebar/SidebarDropdownMenuItem"
import SidebarDropdownMenuItem from "../sidebar/SidebarDropdownMenuItem"
import IconWrapper from "../common/IconWrapper";

interface GenericDropdownMenuProps {
  side?: "top" | "bottom" | "left" | "right";
  avatarSrc?: string;
  title: string;
  items: SidebarDropDownMenuItemProps[];
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
        <SidebarMenuButton className="flex items-center gap-2 rounded-md hover:bg-muted text-sm lg:text-base">
          {/* Avatar (optional) */}
          {avatarSrc && (
            <Avatar className="h-7 w-7 lg:h-8 lg:w-8">
              <AvatarImage src={avatarSrc} alt={`${title} avatar`} />
              <AvatarFallback>{title.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}

          {/* Title */}
          <span className="text-sm font-medium">{title}</span>

          {/* Trigger icon */}
          <IconWrapper icon={MdMoreVert} size={18} className="ml-auto text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} className="w-full">
        {items.map((item) => (
          <SidebarDropdownMenuItem
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
