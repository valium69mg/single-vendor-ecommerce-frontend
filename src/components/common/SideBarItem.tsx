import type { ReactNode } from "react";
import { SidebarMenuItem, SidebarMenuButton } from "../ui/sidebar";
import { useNavigate } from "react-router-dom";

interface SideBarItemProps {
  title: string;
  href: string;
  icon: ReactNode;
}

export default function SideBarItem({ title, href, icon }: SideBarItemProps) {
  const navigate = useNavigate();
  const redirect = () => {
    navigate(href);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <button
          onClick={redirect}
          className="flex items-center gap-2 text-sm lg:text-base"
        >
          {icon}
          <span>{title}</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
