import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";
import { Outlet } from "react-router-dom";
import { IoMenuSharp } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/common/IconWrapper";

function AdminContent() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-full">
      <AdminSideBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="flex items-center mb-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <IconWrapper icon={IoMenuSharp} size={18}/>
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
