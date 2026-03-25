import { SidebarHeader } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { MdAdminPanelSettings } from "react-icons/md";

export default function AdminSideBarHeader() {
  const { t } = useTranslation();
  return (
    <SidebarHeader>
      <div className="flex items-center gap-2 px-2">
        <MdAdminPanelSettings className="w-5 h-5 lg:w-6 lg:h-6" />
        <h1 className="text-sm lg:text-md font-semibold">{t("adminPanel")}</h1>
      </div>
    </SidebarHeader>
  );
}
