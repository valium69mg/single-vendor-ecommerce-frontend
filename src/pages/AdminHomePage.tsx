import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminContent() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-full">
      <AdminSideBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="flex items-center mb-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
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
