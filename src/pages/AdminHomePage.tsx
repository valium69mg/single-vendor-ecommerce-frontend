import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import AdminSideBar from "@/components/admin/AdminSideBar";

export default function AdminHomePage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AdminSideBar/>
        <main className="flex-1 p-6">
          <p>ADMIN HOME PAGE CONTENT </p>
        </main>
      </div>
    </SidebarProvider>
  );
}
