import { useState, useMemo, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { UserContext } from "../context/UserContext";
import { readJson } from "../lib/storage";
import type { LoginResponse } from "../api/api";

const STORAGE_KEY = "loginData";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(() =>
    readJson<LoginResponse>(STORAGE_KEY),
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // UserProvider is the single source of truth for session persistence.
  // Consumers only call `setUser`; the write to storage happens here.
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const value = useMemo(
    () => ({ user, setUser, logout }),
    [user, logout]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
