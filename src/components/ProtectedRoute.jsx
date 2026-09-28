// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { ROLE_HOME } from "../context/authShared";
import { useAuth } from "../hooks/useAuth";

/**
 * Gates a route behind authentication and, optionally, a role.
 *
 * A signed-in user who lands on the wrong dashboard is redirected to their own
 * rather than shown an error, which is what they actually meant to open.
 */
function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-black" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading Synelix
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  }

  return children;
}

export default ProtectedRoute;
