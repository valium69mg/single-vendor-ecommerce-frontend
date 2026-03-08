import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";
import { Outlet } from "react-router-dom";

export default function AdminHomePage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AdminSideBar />

        <main className="flex-1 p-6">
          <Outlet />
        </main>

      </div>
    </SidebarProvider>
  );
}