import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const RequireAuth = ({ children, admin }: { children: ReactNode; admin?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="app-shell flex items-center justify-center"><div className="w-9 h-9 border-[3px] border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
};
