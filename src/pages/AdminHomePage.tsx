import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";
import { Outlet } from "react-router-dom";

export default function AdminHomePage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSideBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
