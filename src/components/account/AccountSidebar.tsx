import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/useUser";

/**
 * RF-FE-021 account sidebar. "Lista de deseos" is intentionally visual-only
 * (its own ticket owns the route); "Cerrar sesión" calls `logout()`.
 */
export default function AccountSidebar() {
  const { t } = useTranslation();
  const { logout } = useUser();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "block px-4 py-3 font-store-body text-sm rounded-none transition-colors",
      isActive
        ? "bg-stone-900 text-white"
        : "text-stone-700 hover:bg-stone-100",
    ].join(" ");

  return (
    <nav
      aria-label={t("account.title")}
      className="w-full shrink-0 border border-stone-200 bg-white sm:w-60"
    >
      <NavLink to="/mi-cuenta/perfil" className={linkClass}>
        {t("account.sidebar.profile")}
      </NavLink>
      <NavLink to="/pedidos" className={linkClass}>
        {t("account.sidebar.orders")}
      </NavLink>
      <NavLink to="/mi-cuenta/direcciones" className={linkClass}>
        {t("account.sidebar.addresses")}
      </NavLink>
      <span
        aria-disabled="true"
        className="block px-4 py-3 font-store-body text-sm text-stone-400 rounded-none"
      >
        {t("account.sidebar.wishlist")}
      </span>
      <button
        type="button"
        onClick={logout}
        className="block w-full px-4 py-3 text-left font-store-body text-sm text-stone-700 rounded-none transition-colors hover:bg-stone-100"
      >
        {t("account.sidebar.logout")}
      </button>
    </nav>
  );
}
