import {
  Sidebar,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AdminSideBarHeader from "../admin/AdminSideBarHeader";
import AdminSideBarFooter from "./AdminSideBarFooter";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronDown,
  Tags,
  Layers,
  Box,
} from "lucide-react";

export default function AdminSideBar() {
  return (
    <Sidebar className="flex flex-col h-full">
      {/* Header */}
      <AdminSideBarHeader />
      <Separator />

      <SidebarGroup>
        <SidebarGroupContent>
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/admin/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Products Accordion */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <Box className="h-4 w-4 mr-2" /> Products
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tags className="h-4 w-4 mr-2" /> Categories
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Layers className="h-4 w-4 mr-2" /> Brands
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Package className="h-4 w-4 mr-2" /> Materials
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Orders */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/admin/orders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Orders</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Users */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/admin/users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Footer (sticks to bottom) */}
    <AdminSideBarFooter />
    </Sidebar>
  );
}
