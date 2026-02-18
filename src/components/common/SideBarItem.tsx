import type { ReactNode } from "react";
import { SidebarMenuItem, SidebarMenuButton } from "../ui/sidebar";

interface SideBarItemProps {
  title: string;
  href: string;
  icon: ReactNode;
}

export default function SideBarItem({ title, href, icon }: SideBarItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href={href} className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
