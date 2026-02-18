import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";

type AdminSideBarFooterProps = {
  side?: "top" | "bottom" | "left" | "right";
};

export default function AdminSideBarFooter({
  side = "right",
}: AdminSideBarFooterProps) {
  const { t } = useTranslation();
  const userCtx = useContext(UserContext);

  if (!userCtx) {
    throw new Error("AdminSideBarFooter must be used within a UserProvider");
  }

  const { logout } = userCtx;

  return (
    <div className="mt-auto mb-3">
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="flex items-center gap-2 rounded-md hover:bg-muted">
                  {/* Avatar */}
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" alt="Admin avatar" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  {/* Username */}
                  <span className="text-sm font-medium">
                    {t("administrator")}
                  </span>
                  {/* Trigger icon */}
                  <MoreVertical className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              {/* Menu content */}
              <DropdownMenuContent side={side} className="w-40">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
