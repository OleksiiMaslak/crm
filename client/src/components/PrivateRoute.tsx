import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export function PrivateRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
