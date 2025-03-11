"use client";

import { useContext, useMemo } from "react";
import { AuthContext, UserRole } from "@/contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const isAdmin = useMemo(() => {
    return !!context.user && context.user.role === UserRole.Admin;
  }, [context.user]);

  const hasRole = (role: UserRole): boolean => {
    if (role === UserRole.Admin) return isAdmin;
    return !!context.user && context.user.role === role;
  };

  return {
    ...context,
    hasRole,
    isAdmin,
  };
};
