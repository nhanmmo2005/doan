import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../auth";

export default function ProtectedRoute({ children, role }) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" />;

  // nếu route yêu cầu role admin mà user không phải admin
  if (role && user.role !== role) return <Navigate to="/feed" />;

  return children;
}
