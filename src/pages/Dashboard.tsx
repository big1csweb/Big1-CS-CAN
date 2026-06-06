import React from "react";
import { useAuth } from "../hooks/use-auth";
import { MemberDashboard } from "../components/dashboard/MemberDashboard";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";
import { SuperAdminDashboard } from "../components/dashboard/SuperAdminDashboard";
import { Navigate } from "react-router-dom";

export function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  if (profile.role === "admin") {
    return <AdminDashboard />;
  }

  return <MemberDashboard />;
}
