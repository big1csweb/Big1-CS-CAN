import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export function Login() {
  const { user, login, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4 text-white font-bold uppercase tracking-widest text-sm">Authenticating...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and access key.");
      return;
    }
    try {
      setError(null);
      await login(email, password);
    } catch (err: any) {
      const errCode = err?.code || '';
      const errMsg = err?.message || '';
      const isInvalidCred = 
        errCode === 'auth/invalid-credential' || 
        errCode === 'auth/user-not-found' || 
        errCode === 'auth/wrong-password' ||
        errMsg.includes('auth/invalid-credential') ||
        errMsg.includes('invalid-credential') ||
        errMsg.includes('user-not-found') ||
        errMsg.includes('wrong-password');

      if (isInvalidCred) {
         setError('Invalid email or access key. If you are new, please use "Join Network".');
      } else {
         setError(errMsg || 'Login failed.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await login();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
         setError(null);
         return;
      }
      setError(err?.message || 'Google Login failed.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-[#050814] overflow-hidden">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none"></div>

      {/* Top Navbar */}
      <nav className="relative z-10 w-full h-16 bg-[#0A0E1A]/80 flex items-center justify-between px-6 lg:px-12 border-b border-white/5">
        <div className="flex items-center gap-2">
           {/* Logo placeholder mimicking Big1CS CAN */}
           <div className="text-xl font-black text-brand-blue flex items-center tracking-tighter">
              BIG<span className="text-brand-yellow">1</span>
              <div className="ml-2 pl-2 border-l-2 border-white/10 flex flex-col justify-center leading-none">
                 <span className="text-[10px] font-bold text-slate-300 tracking-wider">CONSULTANCY</span>
                 <span className="text-[10px] font-bold text-slate-300 tracking-wider">SERVICES</span>
                 <span className="text-[9px] font-bold text-green-500 tracking-widest mt-0.5">C.A.N.</span>
              </div>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-gradient-to-br from-brand-blue to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-[0_0_30px_rgba(1,33,255,0.4)]">
             <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">GROWTH PORTAL ACC<span className="opacity-90">ESS</span></h1>
          <p className="text-xs md:text-sm text-gray-400 font-medium tracking-wide uppercase">Secure Gateway to the CAN Ecosystem</p>
        </div>
        
        <div className="w-full max-w-[420px] bg-[#0A0E1A]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <form onSubmit={handleLogin} className="flex flex-col">
            <div className="space-y-5">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center">
                    REGISTERED EMAIL <span className="text-brand-yellow ml-1">*</span>
                 </label>
                 <div className="relative">
                    <input 
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="partner@big1cs.com"
                       className="w-full bg-[#111827] border border-white/5 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-brand-blue/50 transition-colors"
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center">
                    ACCESS KEY <span className="text-brand-yellow ml-1">*</span>
                 </label>
                 <div className="relative">
                    <input 
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       className="w-full bg-[#111827] border border-white/5 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-brand-blue/50 transition-colors tracking-widest"
                    />
                    <ShieldAlert className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                 </div>
               </div>

               <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" className="rounded bg-[#111827] border-white/10 text-brand-blue focus:ring-brand-blue focus:ring-offset-0" />
                     <span className="text-[11px] text-gray-400 font-medium">Remember Device</span>
                  </label>
                  <button type="button" className="text-[10px] font-black uppercase tracking-wider text-brand-yellow hover:text-yellow-400 transition-colors">Forgot Key?</button>
               </div>
            </div>

            <Button 
              type="submit"
              className="w-full mt-8 py-6 text-sm font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-brand-blue to-[#8A2BE2] hover:opacity-90 shadow-[0_0_20px_rgba(1,33,255,0.3)] transition-all rounded-xl border-none"
            >
              LOGIN
            </Button>

            <div className="relative mt-8">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
               </div>
               <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="bg-[#0A0E1A] px-2 text-slate-400">OR</span>
               </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-6 py-6 text-xs font-bold tracking-widest text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all rounded-xl flex items-center gap-3 justify-center"
            >
               <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 bg-[#0A0E1A]/80 p-0.5 rounded-full" />
               CONTINUE WITH GOOGLE
            </Button>
            
            <div className="mt-8 flex flex-col items-center gap-3 pt-6 border-t border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Not part of the network?</span>
                <Link to="/join" className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300 transition-colors uppercase tracking-widest">
                   Join Network
                </Link>
            </div>
            
            {error && (
              <div className="mt-6 text-sm text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                {error.includes('network-request-failed') ? (
                  <div className="text-left space-y-2">
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
          </form>
        </div>
        
        <div className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
           <ShieldAlert size={12} className="text-green-500" />
           256-Bit End-To-End Encryption &bull; Powered by C.A.N.
        </div>
      </div>
    </div>
  );
}
