import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute Component
 * Protects routes based on user role
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  let userRole = null;

  if (user) {
    try {
      userRole = JSON.parse(user).role;
    } catch (e) {
      userRole = null;
    }
  }

  // If no token or user, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If requiredRole is specified and user doesn't have it, redirect to login
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
