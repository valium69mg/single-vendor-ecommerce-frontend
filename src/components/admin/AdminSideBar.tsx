import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AdminSideBarHeader from "../admin/AdminSideBarHeader";
import AdminSideBarFooter from "./AdminSideBarFooter";
import {
  Hammer,
  Notepad,
  Package,
  SquaresFour,
  StackSimple,
  Storefront,
  Tag,
  Users,
} from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
import SideBarItem from "../sidebar/SideBarItem";
import SideBarAccordion from "../sidebar/SideBarAccordion";
import { useTranslation } from "react-i18next";

export default function AdminSideBar() {
  const { t } = useTranslation();

  const productOptions = [
    {
      id: "products",
      name: t("products"),
      icon: <Package size={ICON.md} aria-hidden />,
      url: "/admin/products",
    },
    {
      id: "categories",
      name: t("categories"),
      icon: <Tag size={ICON.md} aria-hidden />,
      url: "/admin/categories",
    },
    {
      id: "brands",
      name: t("brands"),
      icon: <StackSimple size={ICON.md} aria-hidden />,
      url: "/admin/brands",
    },
    {
      id: "materials",
      name: t("materials"),
      icon: <Hammer size={ICON.md} aria-hidden />,
      url: "/admin/materials",
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
            icon={<SquaresFour size={ICON.md} aria-hidden />}
          />

          {/* Products Accordion */}
          <SideBarAccordion
            title={t("products")}
            icon={<Package size={ICON.md} aria-hidden />}
            options={productOptions}
          />

          {/* Orders */}
          <SideBarItem
            title={t("orders")}
            href="/admin/orders"
            icon={<Notepad size={ICON.md} aria-hidden />}
          />

          {/* Users */}
          <SideBarItem
            title={t("users")}
            href="/admin/users"
            icon={<Users size={ICON.md} aria-hidden />}
          />

          {/* Store */}
          <SideBarItem
            title={t("store")}
            href="/"
            icon={<Storefront size={ICON.md} aria-hidden />}
          />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Footer */}
      <AdminSideBarFooter />
    </Sidebar>
  );
}
