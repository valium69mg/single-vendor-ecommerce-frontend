// NavbarProfile.tsx — "My Profile" item, label hidden on mobile
import { LayoutDashboard, Settings, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/useUser";
import NavbarDropdownMenu from "@/components/navbar/NavbarDropdownMenu";
import { ROLES } from "@/constants/roles";

export default function NavbarProfile() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const items = [
    {
      name: t("myProfile"),
      icon: <UserRound/>,
      onClick: () => navigate("/profile"),
    },
    ...(user?.role === ROLES.ADMIN
      ? [
          {
            name: t("adminPanel"),
            icon: <LayoutDashboard/>,
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      name: t("settings"),
      icon: <Settings/>,
      onClick: () => navigate("/"),
    },
    {
      name: t("logout"),
      icon: <LogOut/>,
      onClick: logout,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <NavbarDropdownMenu
        title={user?.email ?? "User"}
        items={items}
      ></NavbarDropdownMenu>
     
    </div>
  );
}