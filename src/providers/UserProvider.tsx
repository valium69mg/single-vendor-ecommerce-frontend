import { useState } from "react";
import type { ReactNode } from "react";
import { UserContext } from "../context/UserContext";
import type { LoginResponse } from "../api/api";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    const saved = localStorage.getItem("loginData");
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    localStorage.removeItem("loginData");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}
