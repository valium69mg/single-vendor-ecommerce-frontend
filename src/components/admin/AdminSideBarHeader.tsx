import { SidebarHeader } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { MdAdminPanelSettings } from "react-icons/md";

export default function AdminSideBarHeader() {
  const { t } = useTranslation();
  return (
    <SidebarHeader>
      <div className="flex items-center">
        <MdAdminPanelSettings className="w-8 h-8" />
        <h1 className="text-md"> {t("adminPanel")} </h1>
      </div>
    </SidebarHeader>
  );
}
