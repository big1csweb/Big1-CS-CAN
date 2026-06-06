import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Sidebar } from './Sidebar';
import { Menu, X, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export function Layout() {
  const { user, profile, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile.role !== 'super_admin') {
    if (profile.status === 'pending' || !profile.phone || !profile.tier) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  if (profile && profile.status === 'rejected') {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#111827] p-4">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0A0E1A]/80 p-8 rounded-2xl max-w-md text-center border border-white/10 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -z-10" />
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <X size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-black font-brand tracking-tight text-white mb-2">Profile Rejected</h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-4">Your profile has been rejected by an administrator. Please contact support for more information.</p>
              {profile.rejectionRemarks && (
                 <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-left text-sm text-red-200 shadow-inner">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-red-400 block mb-1">Admin Remarks:</span>
                    {profile.rejectionRemarks}
                 </div>
              )}
              <div className="flex flex-col gap-3 w-full mt-8">
                 <button 
                   onClick={() => window.location.href = '/onboarding'} 
                   className="px-4 py-3 bg-brand-blue text-white rounded-lg text-xs tracking-wider uppercase font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-brand-blue/20"
                 >
                   Update Application
                 </button>
                 <button 
                   onClick={() => logout()} 
                   className="px-4 py-3 bg-transparent border border-white/10 text-slate-400 rounded-lg text-xs tracking-wider uppercase font-bold hover:bg-white/5 transition-colors"
                 >
                   Logout
                 </button>
              </div>
           </motion.div>
        </div>
     );
  }

  return (
    <div className="flex h-screen relative bg-[#050814] overflow-hidden font-sans flex-col md:flex-row text-white text-opacity-90">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none fixed"></div>
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none fixed"></div>

      <div className="md:hidden bg-[#0A0E1A]/90 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between text-white shrink-0 z-30 h-[73px]">
         <div className="flex items-center space-x-2">
          <div className="flex items-baseline">
            <span className="text-xl font-[900] tracking-tighter leading-none text-brand-blue">BIG</span>
            <span className="text-xl font-[900] tracking-tighter leading-none text-brand-yellow">1</span>
          </div>
          <div className="flex flex-col justify-center border-l border-white/10 pl-2">
             <span className="text-[8px] font-black text-slate-400 leading-none uppercase tracking-widest block">CONSULTANCY</span>
             <span className="text-[8px] font-black text-slate-400 leading-none uppercase tracking-widest block mt-0.5">SERVICES</span>
            <div className="mt-1">
              <span className="text-[6px] font-black text-brand-green tracking-[0.2em] leading-tight whitespace-nowrap uppercase">C.A.N.</span>
            </div>
          </div>
        </div>
         <div className="flex items-center gap-3">
             <button onClick={() => logout()} className="text-slate-400 hover:text-white p-1 transition-colors" aria-label="Logout">
                <LogOut size={20} />
             </button>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 focus:outline-none text-white transition-colors">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
         </div>
      </div>

      <div className={`${mobileMenuOpen ? 'flex flex-col fixed inset-0 top-[73px] z-20' : 'hidden'} md:flex md:flex-col md:relative md:inset-auto z-10 w-full md:w-64 shrink-0 bg-[#0A0E1A]/95 backdrop-blur-3xl overflow-hidden border-r border-white/5`}>
         <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full relative z-10">
        <div className="mx-auto max-w-7xl relative z-10">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
