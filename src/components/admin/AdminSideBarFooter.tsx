// AdminSideBarFooter.tsx
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Gear, SignOut } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";
import GenericDropdownMenu from "../sidebar/SidebarDropdownMenu";
import { useNavigate } from "react-router-dom";

interface AdminSideBarFooterProps {
  side?: "top" | "bottom" | "left" | "right";
}

export default function AdminSideBarFooter({
  side = "right",
}: AdminSideBarFooterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userCtx = useContext(UserContext);

  if (!userCtx) {
    throw new Error("AdminSideBarFooter must be used within a UserProvider");
  }

  const { logout } = userCtx;

  const items = [
    {
      name: t("settings"),
      icon: <Gear size={ICON.md} aria-hidden />,
      onClick: () => navigate("/"),
    },
    {
      name: t("logout"),
      icon: <SignOut size={ICON.md} aria-hidden />,
      onClick: logout,
    },
    
  ];

  return (
    <div className="mt-auto mb-6">
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
