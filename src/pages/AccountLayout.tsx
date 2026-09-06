import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar/Navbar";
import AccountSidebar from "@/components/account/AccountSidebar";

/**
 * Shell for the `/mi-cuenta` nested route. Mirrors the admin `<Outlet/>`
 * pattern: a shared chrome (navbar + sidebar) around the routed child page.
 * The auth guard lives on the route element (`<ProtectedRoute>`), not here.
 */
export default function AccountLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
        <AccountSidebar />
        <main className="flex-1">
          <h1 className="mb-6 font-store-heading text-2xl text-stone-900">
            {t("account.title")}
          </h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
