import { useNavigate } from "react-router-dom";
import NavbarLogo from "./NavbarLogo";
import NavbarCategories from "./NavbarCategories";
import NavbarSearch from "./NavbarSearch";
import NavbarProfile from "./NavbarProfile";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center w-full sticky top-0 z-50">
      <div className="grid grid-cols-[1fr_2fr_1fr] items-center h-16 w-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-start">
          <NavbarLogo />
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="hidden md:block">
            <NavbarCategories />
          </div>
          <NavbarSearch />
        </div>

        <div className="flex items-center justify-end">
          <NavbarProfile />
        </div>
      </div>
    </div>
  );
}
