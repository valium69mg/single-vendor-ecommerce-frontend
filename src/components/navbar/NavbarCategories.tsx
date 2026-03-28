import { IoIosArrowDown } from "react-icons/io";
import IconWrapper from "../common/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MOCK_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
];

export default function NavbarCategories() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden md:flex items-center gap-1 shrink-0">
          {t("categories")}
          <IconWrapper icon={IoIosArrowDown} size={18}/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {MOCK_CATEGORIES.map((cat) => (
          <DropdownMenuItem
            key={cat}
            onClick={() => navigate(`/?category=${cat}`)}
          >
            {cat}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}