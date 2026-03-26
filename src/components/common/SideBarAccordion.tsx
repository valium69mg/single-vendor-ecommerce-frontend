import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";

interface AccordionItemProps {
  name: string;
  icon: ReactNode;
  url: string;
}

function AccordionItem({ name, icon, url }: AccordionItemProps) {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const redirect = () => {
    setOpenMobile(false);
    navigate(url);
  };

  return (
    <DropdownMenuItem onClick={redirect}>
      {icon} {name}
    </DropdownMenuItem>
  );
}

interface SideBarOption {
  id: string;
  name: string;
  icon: ReactNode;
  url: string;
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
          <SidebarMenuButton className="flex items-center gap-2 text-sm lg:text-base">
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
              url={option.url}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
