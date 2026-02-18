import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AdminSideBarHeader from "../admin/AdminSideBarHeader";
import AdminSideBarFooter from "./AdminSideBarFooter";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Box,
  Tags,
  Layers,
} from "lucide-react";
import SideBarItem from "../common/SideBarItem";
import SideBarAccordion from "../common/SideBarAccordion";

const productOptions = [
  {
    id: "products",
    name: "Products",
    icon: <Box className="h-4 w-4 mr-2" />,
  },
  {
    id: "categories",
    name: "Categories",
    icon: <Tags className="h-4 w-4 mr-2" />,
  },
  {
    id: "brands",
    name: "Brands",
    icon: <Layers className="h-4 w-4 mr-2" />,
  },
  {
    id: "materials",
    name: "Materials",
    icon: <Package className="h-4 w-4 mr-2" />,
  },
];
export default function AdminSideBar() {
  return (
    <Sidebar className="flex flex-col h-full">
      {/* Header */}
      <AdminSideBarHeader />
      <Separator />

      <SidebarGroup>
        <SidebarGroupContent>
          {/* Dashboard */}
          <SideBarItem
            title="Dashboard"
            href="/admin/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
          />

          {/* Products Accordion */}
          <SideBarAccordion
            title="Products"
            icon={<Package className="h-4 w-4" />}
            options={productOptions}
          />

          {/* Orders */}
          <SideBarItem
            title="Orders"
            href="/admin/orders"
            icon={<ShoppingCart className="h-4 w-4" />}
          />

          {/* Users */}
          <SideBarItem
            title="Users"
            href="/admin/users"
            icon={<Users className="h-4 w-4" />}
          />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Footer (sticks to bottom) */}
      <AdminSideBarFooter />
    </Sidebar>
  );
}
