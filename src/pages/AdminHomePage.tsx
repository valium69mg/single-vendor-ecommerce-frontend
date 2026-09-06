import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { List } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";

function AdminContent() {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  return (
    <div data-context="admin" className="flex h-dvh w-full">
      <AdminSideBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-stone-50">
        <div className="flex items-center mb-4 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            aria-label={t("adminMenuOpen")}
          >
            <List size={ICON.md} aria-hidden />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AdminContent />
    </SidebarProvider>
  );
}
