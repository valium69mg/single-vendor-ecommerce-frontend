import { SignIn, SignOut, SquaresFour, User, UserPlus } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
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
      icon: <User size={ICON.md} aria-hidden />,
      onClick: () => navigate("/mi-cuenta/perfil"),
    },
    ...(user?.role === ROLES.ADMIN
      ? [
          {
            name: t("adminPanel"),
            icon: <SquaresFour size={ICON.md} aria-hidden />,
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      name: t("logout"),
      icon: <SignOut size={ICON.md} aria-hidden />,
      onClick: logout,
    },
  ];

  const guestItems = [
    {
      name: t("login"),
      icon: <SignIn size={ICON.md} aria-hidden />,
      onClick: () => navigate("/login"),
    },
    {
      name: t("register"),
      icon: <UserPlus size={ICON.md} aria-hidden />,
      onClick: () => navigate("/registro"),
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
