import { IoSettingsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { LuLogOut, LuLogIn, LuUserPlus } from "react-icons/lu";
import { RxDashboard } from "react-icons/rx";
import IconWrapper from "../common/IconWrapper";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/useUser";
import NavbarDropdownMenu from "@/components/navbar/NavbarDropdownMenu";
import { ROLES } from "@/constants/roles";

export default function NavbarProfile() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const authItems = [
    {
      name: t("myProfile"),
      icon: <IconWrapper icon={FaRegUser} size={18} />,
      onClick: () => navigate("/profile"),
    },
    ...(user?.role === ROLES.ADMIN
      ? [
          {
            name: t("adminPanel"),
            icon: <IconWrapper icon={RxDashboard} size={18} />,
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      name: t("settings"),
      icon: <IconWrapper icon={IoSettingsOutline} size={18} />,
      onClick: () => navigate("/settings"),
    },
    {
      name: t("logout"),
      icon: <IconWrapper icon={LuLogOut} size={18} />,
      onClick: logout,
    },
  ];

  const guestItems = [
    {
      name: t("login"),
      icon: <IconWrapper icon={LuLogIn} size={18} />,
      onClick: () => navigate("/login"),
    },
    {
      name: t("register"),
      icon: <IconWrapper icon={LuUserPlus} size={18} />,
      onClick: () => navigate("/register"),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <NavbarDropdownMenu
        title={user?.email}
        items={user ? authItems : guestItems}
      />
    </div>
  );
}
