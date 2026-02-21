// AdminSideBarFooter.tsx
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";
import GenericDropdownMenu from "../common/GenericDropdownMenu";

interface AdminSideBarFooterProps {
  side?: "top" | "bottom" | "left" | "right";
}

export default function AdminSideBarFooter({
  side = "right",
}: AdminSideBarFooterProps) {
  const { t } = useTranslation();
  const userCtx = useContext(UserContext);

  if (!userCtx) {
    throw new Error("AdminSideBarFooter must be used within a UserProvider");
  }

  const { logout } = userCtx;

  const items = [
    {
      name: t("logout"),
      icon: <LogOut className="h-4 w-4 mr-2 text-muted-foreground" />,
      onClick: logout,
    },
  ];

  return (
    <div className="mt-auto mb-3">
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <GenericDropdownMenu
              side={side}
              title={t("administrator")}
              avatarSrc={"default"}
              items={items}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
