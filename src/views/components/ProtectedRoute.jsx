import { Navigate } from "react-router-dom";
import { isAuthenticated, hasRole } from "../../controllers/AuthController";

export default function ProtectedRoute({ children, role }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  if (role && !hasRole(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
