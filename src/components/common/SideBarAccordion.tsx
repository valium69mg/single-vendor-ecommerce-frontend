import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface AccordionItemProps {
  name: string;
  icon: ReactNode;
}

function AccordionItem({ name, icon }: AccordionItemProps) {
  return (
    <DropdownMenuItem>
      {icon} {name}
    </DropdownMenuItem>
  );
}

interface SideBarOption {
  id: string;
  name: string;
  icon: ReactNode;
}

interface SideBarAccordionProps {
  title: string;
  icon: ReactNode;
  options: SideBarOption[];
}

export default function SideBarAccordion({
  title,
  icon,
  options,
}: SideBarAccordionProps) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
          {options.map((option) => (
            <AccordionItem
              key={option.id}
              name={option.name}
              icon={option.icon}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
