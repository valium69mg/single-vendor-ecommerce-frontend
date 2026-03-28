// AdminSideBarFooter.tsx
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { IoSettingsOutline } from "react-icons/io5";
import { LuLogOut } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";
import GenericDropdownMenu from "../sidebar/SidebarDropdownMenu";
import { useNavigate } from "react-router-dom";
import IconWrapper from "../common/IconWrapper";

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
      icon: <IconWrapper icon={IoSettingsOutline} size={18}/>,
      onClick: () => navigate("/"),
    },
    {
      name: t("logout"),
      icon: <IconWrapper icon={LuLogOut} size={18} />,
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
