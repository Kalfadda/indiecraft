import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";
import { BlockedUserScreen } from "./BlockedUserScreen";

export function ProtectedRoute() {
  const { user, profile, isLoading, isBlocked } = useAuth();

  // Only show loading if we're actually loading AND don't have user data yet
  if (isLoading && !user) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f4f7'
      }}>
        <Loader2 style={{ width: 32, height: 32, color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isBlocked) {
    return <BlockedUserScreen reason={profile?.blocked_reason} />;
  }

  return <Outlet />;
}
