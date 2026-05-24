import { SidebarHeader } from "@/components/ui/sidebar";

export default function AdminSideBarHeader() {
  return (
    <SidebarHeader className="px-4 py-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-amber-700 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm font-store-heading">J</span>
        </div>
        <div className="flex flex-col">
          <span className="font-store-heading text-base font-semibold text-sidebar-foreground leading-tight">
            Joyería
          </span>
          <span className="font-store-body text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">
            Admin Panel
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}
