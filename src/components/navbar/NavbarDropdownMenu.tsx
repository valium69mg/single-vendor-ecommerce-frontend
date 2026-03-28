import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import type { SidebarDropDownMenuItemProps } from "../sidebar/SidebarDropdownMenuItem";
import GenericDropdownMenuItem from "../sidebar/SidebarDropdownMenuItem";

interface NavbarDropdownMenuProps {
  avatarSrc?: string;
  title: string;
  items: SidebarDropDownMenuItemProps[];
}

export default function NavbarDropdownMenu({
  avatarSrc,
  title,
  items,
}: NavbarDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt={title} />
            <AvatarFallback className="text-xs bg-muted">
              {title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
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