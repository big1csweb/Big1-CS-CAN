import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  IdCard,
  CheckCircle,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const { profile, logout } = useAuth();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  const roleDisplay =
    profile?.role === "super_admin"
      ? "Super Admin"
      : profile?.role === "admin"
        ? "Admin"
        : "Member";

  const getRoleBadgeClasses = (role?: string) => {
    switch (role) {
      case "super_admin":
        return "bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow shadow-[0_0_10px_rgba(255,222,1,0.1)]";
      case "admin":
        return "bg-brand-blue/15 border-brand-blue/30 text-brand-blue shadow-[0_0_10px_rgba(1,33,255,0.1)]";
      default:
        return "bg-brand-green/15 border-brand-green/30 text-brand-green shadow-[0_0_10px_rgba(61,179,65,0.1)]";
    }
  };

  const navItems = [
    {
      to: "/",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["member", "admin", "super_admin"],
    },
    {
      to: "/team",
      icon: Users,
      label: "My Team",
      roles: ["member", "admin", "super_admin"],
      show: profile?.tier === "growth_partner",
    },
    {
      to: "/leads",
      icon: Users,
      label: "Leads Pipeline",
      roles: ["member", "admin", "super_admin"],
    },
    {
      to: "/earnings",
      icon: BarChart3,
      label: "Earnings",
      roles: ["member", "admin", "super_admin"],
    },
    {
      to: "/marketing",
      icon: FileText,
      label: "Marketing Materials",
      roles: ["member", "admin", "super_admin"],
    },
    {
      to: "/cards",
      icon: IdCard,
      label: "ID & Visiting Cards",
      roles: ["member", "admin", "super_admin"],
    },
    {
      to: "/profile",
      icon: UserCircle,
      label: "My Profile",
      roles: ["member", "admin", "super_admin"],
    },
    {
      to: "/directory",
      icon: Users,
      label: "C.A.N. Members",
      roles: ["admin", "super_admin"],
    },
    {
      to: "/approvals",
      icon: CheckCircle,
      label: "Member Approvals",
      roles: ["admin", "super_admin"],
    },
    {
      to: "/admin-approvals",
      icon: ShieldCheck,
      label: "Admin Approvals",
      roles: ["super_admin"],
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Super Admin",
      roles: ["super_admin"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(profile?.role || "member") && (item.show !== false)
  );

  return (
    <aside className="h-full flex flex-col text-slate-300 w-full relative overflow-hidden bg-slate-950/60 backdrop-blur-3xl">
      {/* Decorative gradients / subtle neon glowing background (clean & premium design) */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-brand-blue/15 to-transparent pointer-events-none opacity-40"></div>
      <div className="absolute -left-16 top-1/4 w-32 h-32 bg-brand-blue/8 rounded-full blur-[40px] pointer-events-none"></div>
      <div className="absolute -right-16 bottom-1/4 w-32 h-32 bg-brand-yellow/5 rounded-full blur-[40px] pointer-events-none"></div>

      <div className="p-6 shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-md relative z-10 hidden md:block">
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-baseline">
            <span className="text-3xl font-[900] tracking-tighter leading-none text-brand-blue drop-shadow-[0_0_12px_rgba(1,33,255,0.5)]">
              BIG
            </span>
            <span className="text-3xl font-[900] tracking-tighter leading-none text-brand-yellow drop-shadow-[0_0_12px_rgba(255,222,1,0.5)]">
              1
            </span>
          </div>
          <div className="flex flex-col justify-center border-l border-slate-700 pl-3">
            <span className="text-[9px] font-black text-slate-300 leading-none uppercase tracking-widest block">
              CONSULTANCY
            </span>
            <span className="text-[9px] font-black text-slate-300 leading-none uppercase tracking-widest block mt-0.5">
              SERVICES
            </span>
            <div className="mt-1">
              <span className="text-[9px] font-black text-brand-green tracking-[0.3em] leading-tight whitespace-nowrap uppercase">
                C.A.N.
              </span>
            </div>
          </div>
        </div>
        <div className={cn(
          "inline-block mt-1 px-2.5 py-1 border rounded text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
          getRoleBadgeClasses(profile?.role)
        )}>
          {roleDisplay}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 relative z-10 custom-scrollbar-dark">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-bold text-[13px] tracking-wide relative border border-transparent cursor-pointer",
                isActive
                  ? "bg-brand-blue/15 text-white shadow-[0_2px_12px_rgba(1,33,255,0.12)] border-brand-blue/35"
                  : "text-slate-300 hover:bg-brand-blue/5 hover:text-white hover:border-brand-blue/10",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={cn(
                    "transition-all duration-250 shrink-0",
                    isActive
                      ? "text-brand-yellow drop-shadow-[0_0_5px_rgba(255,222,1,0.35)]"
                      : "text-slate-400 group-hover:text-brand-blue",
                  )}
                />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[55%] bg-gradient-to-b from-brand-blue to-teal-400 rounded-r-md shadow-[0_0_8px_rgba(1,33,255,0.65)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 bg-slate-950/60 shrink-0 relative z-10 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-900/40 rounded-lg border border-white/10 shadow-md">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-brand-blue to-slate-900 flex items-center justify-center text-white shrink-0 shadow-md font-bold border border-white/20">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white truncate leading-tight">
              {profile?.name || "User"}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-brand-yellow truncate mt-0.5">
              {profile?.tier?.replace("_", " ") || ""}
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:border-red-500/20 transition-all text-sm font-bold text-slate-400 hover:text-red-400 group border border-transparent cursor-pointer"
        >
          <LogOut
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Logout
        </button>
      </div>
    </aside>
  );
}
