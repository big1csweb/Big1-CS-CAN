import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Navigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { motion } from 'motion/react';
import { FileText, UserPlus, Check, Briefcase, GraduationCap, Building2, Laptop, MoreHorizontal, ArrowLeft } from 'lucide-react';

const COE_OPTIONS = [
  'Setup',
  'Compliance',
  'Wealth',
  'Assurance',
  'Advisory',
  'Diligence'
];

const PRO_STATUS_OPTIONS = [
  { value: 'job', label: 'Employed', description: 'Working under an employer', icon: Briefcase },
  { value: 'profession', label: 'Professional', description: 'CA, Lawyer, Architect, etc.', icon: GraduationCap },
  { value: 'business', label: 'Business', description: 'Owner or Entrepreneur', icon: Building2 },
  { value: 'freelancer', label: 'Freelancer', description: 'Independent Consultant', icon: Laptop },
  { value: 'other', label: 'Other', description: 'Other specified status', icon: MoreHorizontal }
];

export function Join() {
  const { user, login, signup, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    canIdPrefix: '',
    tier: 'growth_consultant',
    selectedCoes: [] as string[],
    professionalStatus: '',
    professionalDetails: {} as any,
    experienceMonths: '',
    whyJoin: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4 text-white font-bold uppercase tracking-widest text-sm">Loading Registration...</div>;
  }

  // If already fully logged in and approved, go to dashboard
  if (user && formData.name === '') {
     return <Navigate to="/onboarding" replace />;
  }

  const toggleCoe = (coe: string) => {
     setFormData(prev => ({
        ...prev,
        selectedCoes: prev.selectedCoes.includes(coe) 
           ? prev.selectedCoes.filter(c => c !== coe)
           : [...prev.selectedCoes, coe]
     }));
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      window.location.href = '/onboarding';
    } catch (err: any) {
       console.error("Join error:", err);
       let errorMessage = err.message || "An error occurred during onboarding.";
       const errCode = err?.code || '';
       const errMsg = err?.message || '';
       if (errCode === 'auth/email-already-in-use' || errMsg.includes('auth/email-already-in-use') || errMsg.includes('email-already-in-use')) {
         errorMessage = "Account already exists with this email. Please return to login.";
       } else if (errCode === 'auth/weak-password' || errMsg.includes('auth/weak-password') || errMsg.includes('weak-password')) {
         errorMessage = "Access key is too weak. Please use at least 6 characters.";
       } else if (errCode === 'auth/invalid-email' || errMsg.includes('auth/invalid-email') || errMsg.includes('invalid-email')) {
         errorMessage = "Please enter a valid email address.";
       } else if (errMsg.includes('different password') || errMsg.includes('different-password')) {
         errorMessage = "Account exists with a different password. Please return to login.";
       }
       setError(errorMessage);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#050814] flex items-center justify-center p-4 selection:bg-brand-yellow selection:text-brand-dark overflow-y-auto pt-24 pb-12 font-sans">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none fixed"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none fixed"></div>

       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl z-10 relative mt-12 mb-12">
       <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Login
       </Link>
       <Card className="w-full border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative bg-[#0A0E1A]/80 backdrop-blur-xl">
          
          <CardHeader className="border-b border-white/5 pb-8 pt-10 px-8 lg:px-12">
             <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-purple-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-[0_0_30px_rgba(1,33,255,0.4)] mx-auto">
               <UserPlus size={32} />

             </div>
             <CardTitle className="text-3xl font-black font-brand tracking-tight text-white text-center">Join C.A.N.</CardTitle>
             <p className="text-[13px] font-medium text-slate-400 mt-3 leading-relaxed text-center px-4">Complete your application below. You will use your email and access key to login.</p>
          </CardHeader>
          <form onSubmit={handleJoin}>
             <CardContent className="space-y-6 pt-8 px-5 sm:px-8">
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name</label>
                      <Input 
                         required 
                         value={formData.name} 
                         onChange={(e) => setFormData({...formData, name: e.target.value})} 
                         placeholder="John Doe"
                         className="h-12 bg-[#111827] border-white/10 text-white focus:ring-brand-blue/20 focus:border-brand-blue placeholder:text-slate-600"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address (Google ID)</label>
                      <Input 
                         required 
                         type="email"
                         value={formData.email} 
                         onChange={(e) => setFormData({...formData, email: e.target.value})} 
                         placeholder="john@gmail.com"
                         className="h-12 bg-[#111827] border-white/10 text-white focus:ring-brand-blue/20 focus:border-brand-blue placeholder:text-slate-600"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Set Access Key (Password)</label>
                      <Input 
                         required 
                         type="password"
                         value={formData.password} 
                         onChange={(e) => setFormData({...formData, password: e.target.value})} 
                         placeholder="••••••••"
                         className="h-12 bg-[#111827] border-white/10 text-white focus:ring-brand-blue/20 focus:border-brand-blue placeholder:text-slate-600 tracking-widest"
                      />
                   </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 bg-white/5 border-t border-white/5 pt-8 px-8 pb-10">
                 {error && (
                   <div className="w-full text-sm text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-left">
                     {error.includes('network-request-failed') ? (
                       <div className="space-y-2">
                         <p className="font-bold text-center">Network Connection Failed</p>
                         <p className="text-xs text-gray-300">This usually occurs due to browser security policies or ad-blockers inside iframes. To troubleshoot:</p>
                         <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1">
                           <li><strong>Disable AdBlockers / Brave Shield</strong> on this tab, as they frequently block Google Auth APIs.</li>
                           <li><strong>Check GCP API Key restrictions:</strong> Ensure your API Key in Google Cloud Console does not have HTTP Referrer restrictions blocking this preview domain: <code className="bg-[#111827] px-1 py-0.5 rounded text-[10px] break-all">https://ais-dev-kbnomfknbnnejnyfaxg6df-688980689186.asia-southeast1.run.app</code></li>
                           <li><strong>Open in a New Tab</strong> using the top-right button of your workspace to bypass iframe sandboxing constraints.</li>
                         </ul>
                       </div>
                     ) : (
                       <p className="text-center font-medium">{error}</p>
                     )}
                   </div>
                 )}
                 <Button className="w-full h-14 bg-brand-blue hover:bg-blue-600 text-white font-bold uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(1,33,255,0.4)] transition-all" type="submit" disabled={loading}>
                   {loading ? (
                     <span className="flex items-center gap-2">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Processing...
                     </span>
                   ) : (
                     <span className="flex items-center gap-3">
                       Create Account
                     </span>
                   )}
                </Button>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Your profile will be manually verified by Admins</p>
             </CardFooter>
          </form>
       </Card>
       </motion.div>
    </div>
  );
}
