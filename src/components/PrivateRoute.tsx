import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-9 h-9 border-[3px] border-gray-200 border-t-blue-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default PrivateRoute;
