import { createContext } from "react";
import type { LoginResponse } from "../api/api";

export interface UserContextType {
  user: LoginResponse | null;
  setUser: (user: LoginResponse | null) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
