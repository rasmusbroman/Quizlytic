"use client";

import { redirect } from "next/navigation";
import { UserRole } from "@/contexts/AuthContext";

export const requireAuth = (
  isAuthenticated: boolean,
  isLoading: boolean,
  redirectTo: string = "/"
) => {
  if (isLoading) return;

  if (!isAuthenticated) {
    window.location.href = redirectTo;
  }
};

export const requireRole = (
  isAuthenticated: boolean,
  isLoading: boolean,
  userRole: UserRole | null,
  requiredRole: UserRole,
  redirectTo: string = "/"
) => {
  if (isLoading) return;

  if (!isAuthenticated || userRole !== requiredRole) {
    window.location.href = redirectTo;
  }
};

export const withAuth = (Component: React.ComponentType<any>) => {
  return function ProtectedRoute(props: any) {
    const session = null;

    if (!session) {
      redirect("/");
    }
    return <Component {...props} />;
  };
};
