import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { LeadsList } from "./pages/LeadsList";
import { NewLead } from "./pages/NewLead";
import { LeadDetail } from "./pages/LeadDetail";
import { Approvals } from "./pages/Approvals";
import { AdminApprovals } from "./pages/AdminApprovals";
import { Earnings } from "./pages/Earnings";
import { Marketing } from "./pages/Marketing";
import { Settings } from "./pages/Settings";
import { Cards } from "./pages/Cards";
import { Directory } from "./pages/Directory";
import { Profile } from "./pages/Profile";
import { MyTeam } from "./pages/MyTeam";

import { Join } from "./pages/Join";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/join" element={<Join />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<LeadsList />} />
            <Route path="leads/new" element={<NewLead />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="admin-approvals" element={<AdminApprovals />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="cards" element={<Cards />} />
            <Route path="directory" element={<Directory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="team" element={<MyTeam />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
