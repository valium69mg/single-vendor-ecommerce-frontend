import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

function AdminContent() {
  const { toggleSidebar } = useSidebar();

  return (
    <div data-context="admin" className="flex h-dvh w-full">
      <AdminSideBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-stone-50">
        <div className="flex items-center mb-4 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
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
