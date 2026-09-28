// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../context/authShared";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
