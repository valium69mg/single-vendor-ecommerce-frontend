import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AdminSideBarHeader from "../admin/AdminSideBarHeader";
import AdminSideBarFooter from "./AdminSideBarFooter";
import IconWrapper from "../common/IconWrapper";
import { RxDashboard } from "react-icons/rx";
import { BsBoxSeam } from "react-icons/bs";
import { CgNotes } from "react-icons/cg";
import { TbUsers } from "react-icons/tb";
import { BsTags } from "react-icons/bs";
import { IoLayersOutline } from "react-icons/io5";
import { TbHammer } from "react-icons/tb";
import SideBarItem from "../sidebar/SideBarItem";
import SideBarAccordion from "../sidebar/SideBarAccordion";
import { useTranslation } from "react-i18next";
import { IoStorefrontOutline } from "react-icons/io5";

export default function AdminSideBar() {
  const { t } = useTranslation();

  const productOptions = [
    {
      id: "products",
      name: t("products"),
      icon: <IconWrapper icon={BsBoxSeam} size={18} />,
      url: "/admin/products",
    },
    {
      id: "categories",
      name: t("categories"),
      icon: <IconWrapper icon={BsTags} size={18} />,
      url: "/admin/categories",
    },
    {
      id: "brands",
      name: t("brands"),
      icon: <IconWrapper icon={IoLayersOutline} size={18} />,
      url: "/admin/products",
    },
    {
      id: "materials",
      name: t("materials"),
      icon: <IconWrapper icon={TbHammer} size={18} />,
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
            icon={<IconWrapper icon={RxDashboard} size={18} />}
          />

          {/* Products Accordion */}
          <SideBarAccordion
            title={t("products")}
            icon={<IconWrapper icon={BsBoxSeam} size={18} />}
            options={productOptions}
          />

          {/* Orders */}
          <SideBarItem
            title={t("orders")}
            href="/admin/orders"
            icon={<IconWrapper icon={CgNotes} size={18} />}
          />

          {/* Users */}
          <SideBarItem
            title={t("users")}
            href="/admin/users"
            icon={<IconWrapper icon={TbUsers} size={18} />}
          />

          {/* Store */}
          <SideBarItem
            title={t("store")}
            href="/"
            icon={<IconWrapper icon={IoStorefrontOutline} size={18} />}
          />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Footer */}
      <AdminSideBarFooter />
    </Sidebar>
  );
}
