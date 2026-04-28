// frontend/src/components/ProtectedRoute.jsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute() {
  const { signed, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return signed ? <Outlet /> : <Navigate to="/login" />;
}

export default ProtectedRoute;
