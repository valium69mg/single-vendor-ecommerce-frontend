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
import { useTranslation } from "react-i18next";

export default function AdminSideBar() {
  const { t } = useTranslation();

  const productOptions = [
    {
      id: "products",
      name: t("products"),
      icon: <Box className="h-4 w-4 mr-2" />,
      url: "/admin/products",
    },
    {
      id: "categories",
      name: t("categories"),
      icon: <Tags className="h-4 w-4 mr-2" />,
      url: "/admin/categories",
    },
    {
      id: "brands",
      name: t("brands"),
      icon: <Layers className="h-4 w-4 mr-2" />,
      url: "/admin/products",
    },
    {
      id: "materials",
      name: t("materials"),
      icon: <Package className="h-4 w-4 mr-2" />,
      url: "/admin/products",
    },
  ];

  return (
    <Sidebar
      className="fixed inset-y-0 left-0 z-50 flex flex-col h-full w-64 lg:w-68
             lg:static lg:z-auto
             data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0
             transition-transform duration-300 ease-in-out"
    >
      {/* Header */}
      <AdminSideBarHeader />
      <Separator />

      <SidebarGroup>
        <SidebarGroupContent>
          {/* Dashboard */}
          <SideBarItem
            title={t("dashboard")}
            href="/admin/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
          />

          {/* Products Accordion */}
          <SideBarAccordion
            title={t("products")}
            icon={<Package className="h-4 w-4" />}
            options={productOptions}
          />

          {/* Orders */}
          <SideBarItem
            title={t("orders")}
            href="/admin/orders"
            icon={<ShoppingCart className="h-4 w-4" />}
          />

          {/* Users */}
          <SideBarItem
            title={t("users")}
            href="/admin/users"
            icon={<Users className="h-4 w-4" />}
          />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Footer */}
      <AdminSideBarFooter />
    </Sidebar>
  );
}
