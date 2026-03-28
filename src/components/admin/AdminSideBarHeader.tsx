import { SidebarHeader } from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import IconWrapper from "../common/IconWrapper";

export default function AdminSideBarHeader() {
  const { t } = useTranslation();
  return (
    <SidebarHeader>
      <div className="flex items-center gap-2 px-2">
        <IconWrapper icon={MdOutlineAdminPanelSettings} size={24} />
        <h1 className="text-sm lg:text-md font-semibold">{t("adminPanel")}</h1>
      </div>
    </SidebarHeader>
  );
}
