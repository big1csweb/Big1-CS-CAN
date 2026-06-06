import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, CreditCard, IdCard } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { motion } from 'motion/react';

export function Cards() {
  const { profile } = useAuth();
  
  const idCardRef = useRef<HTMLDivElement>(null);
  const visitingCardRef = useRef<HTMLDivElement>(null);

  const [brandSettings, setBrandSettings] = useState({ logoUrl: '/logo.png', primaryColor: '#2563eb' });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'branding'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBrandSettings({
          logoUrl: data.logoUrl || '/logo.png',
          primaryColor: data.primaryColor || '#2563eb'
        });
      }
    }, (error) => {
      console.error("Failed to fetch branding: ", error);
    });

    return () => unsubscribe();
  }, []);

  const downloadImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">ID & Visiting Cards</h1>
        <p className="text-slate-400 font-medium mt-1">Download and share your official Big1CS C.A.N. credentials.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 xl:grid-cols-2 gap-8"
      >
        
        {/* ID Card Box */}
        <motion.div variants={item}>
        <Card className="border-white/10 shadow-sm overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between bg-[#111827] border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-base font-black font-brand uppercase tracking-wide text-white">
               <IdCard size={18} className="text-brand-blue" />
               Digital ID Card
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => downloadImage(idCardRef, 'id-card.png')} className="font-bold uppercase tracking-wider text-[10px] h-8 text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5 hover:text-blue-800">
              <Download size={14} className="mr-1.5" /> Download
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#111827] py-12 flex-1">
             
            {/* The ID Card Element */}
            <div 
              ref={idCardRef}
              className="w-[280px] h-[440px] bg-[#0A0E1A]/80 rounded-2xl shadow-xl overflow-hidden flex flex-col relative border border-white/5"
            >
              <div className="h-32 w-full relative overflow-hidden" style={{ backgroundColor: brandSettings.primaryColor }}>
                 <div className="absolute inset-0 bg-[#0f172a] opacity-20 mix-blend-multiply"></div>
                 <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#0A0E1A]/80/10 rounded-full blur-2xl"></div>
                 <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-[#0A0E1A]/80/10 rounded-full blur-xl"></div>
                 <div className="absolute top-4 left-4 text-white font-black font-brand tracking-wide flex items-center gap-2 z-10 w-full pr-8">
                    <img src={brandSettings.logoUrl} alt="Logo" className="h-6 w-auto max-w-[150px] object-contain brightness-0 invert" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.style.display = 'flex'; }} />
                    <div className="w-8 h-8 bg-[#0A0E1A]/80/20 backdrop-blur-sm rounded-md items-center justify-center font-bold hidden">B1</div>
                    <span className="text-xl leading-none pt-1 truncate">{brandSettings.logoUrl.includes('logo.png') ? 'Big1CS' : ''}</span>
                 </div>
              </div>
              <div className="flex-1 flex flex-col items-center pt-14 relative px-6 text-center">
                 <div className="absolute -top-12 w-24 h-24 bg-[#0A0E1A]/80 rounded-2xl p-1 shadow-lg transform rotate-3">
                    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-4xl font-brand transform -rotate-3 overflow-hidden">
                       {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                 </div>
                 
                 <h2 className="text-xl font-black text-white mt-2 font-brand">{profile?.name || 'Member Name'}</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue mt-1 mb-6 py-1.5 px-3 bg-brand-blue/10 rounded-md inline-block border border-brand-blue/20">
                    {profile?.tier?.replace('_', ' ') || 'Member Tier'}
                 </p>

                 <div className="w-full text-left space-y-4">
                    <div className="bg-[#111827] px-3 py-2 rounded-lg border border-white/10">
                       <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">C.A.N. ID</p>
                       <p className="text-[11px] font-bold text-white font-mono tracking-tight">{profile?.canId || 'your.id.can@big1cs'}</p>
                    </div>
                    <div className="bg-[#111827] px-3 py-2 rounded-lg border border-white/10">
                       <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Contact</p>
                       <p className="text-sm font-bold text-white">{profile?.phone || 'Not Provided'}</p>
                    </div>
                 </div>
              </div>
              <div className="h-12 bg-slate-900 w-full flex items-center justify-center">
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Client Acquisition Network</p>
              </div>
            </div>

          </CardContent>
        </Card>
        </motion.div>

        {/* Visiting Card Box */}
        <motion.div variants={item}>
        <Card className="border-white/10 shadow-sm overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between bg-[#111827] border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-base font-black font-brand uppercase tracking-wide text-white">
               <CreditCard size={18} className="text-brand-blue" />
               Visiting Card
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => downloadImage(visitingCardRef, 'visiting-card.png')} className="font-bold uppercase tracking-wider text-[10px] h-8 text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5 hover:text-blue-800">
              <Download size={14} className="mr-1.5" /> Download
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#111827] py-12 overflow-x-auto flex-1">
             
            {/* The Visiting Card Element (Standard US aspect ratio 3.5x2 -> roughly 400x230) */}
            <div 
              ref={visitingCardRef}
              className="w-[400px] h-[230px] bg-[#0A0E1A]/80 rounded-xl shadow-xl overflow-hidden flex relative border-x border-y border-white/5 shrink-0"
            >
              <div className="w-1/3 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden" style={{ backgroundColor: brandSettings.primaryColor }}>
                 <div className="absolute inset-0 bg-[#0f172a] opacity-20 mix-blend-multiply"></div>
                 <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-40 h-40 bg-[#0A0E1A]/80/10 rounded-full blur-2xl"></div>
                 <img src={brandSettings.logoUrl} alt="Logo" className="h-10 w-auto mb-3 brightness-0 invert z-10 max-w-[100px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.style.display = 'flex'; }} />
                 <div className="w-12 h-12 bg-[#0A0E1A]/80/20 backdrop-blur-sm rounded-lg items-center justify-center font-black text-2xl mb-3 shadow-lg z-10 hidden border border-white/30 hidden">B1</div>
                 {brandSettings.logoUrl.includes('logo.png') && <div className="font-black font-brand tracking-widest text-lg z-10 text-center">Big1CS</div>}
                 <div className="text-[6px] text-white/70 mt-1.5 tracking-[0.3em] text-center font-bold z-10 opacity-80 uppercase">CLIENT ACQUISITION NETWORK</div>
              </div>
              <div className="w-2/3 p-8 flex flex-col justify-center h-full relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-bl-full -z-10"></div>
                 <h2 className="text-2xl font-black font-brand text-white leading-none">{profile?.name || 'Member Name'}</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue mt-2">{profile?.tier?.replace('_', ' ') || 'Member Tier'}</p>
                 
                 <div className="mt-8 space-y-3">
                    <div className="flex items-center text-xs text-gray-600 font-medium bg-[#111827]/80 px-2 py-1.5 rounded-md border border-white/10">
                       <span className="w-6 text-[9px] font-black uppercase tracking-widest text-gray-400">E</span> 
                       <span className="truncate">{profile?.email || 'email@example.com'}</span>
                    </div>
                    {profile?.phone && (
                       <div className="flex items-center text-xs text-gray-600 font-medium bg-[#111827]/80 px-2 py-1.5 rounded-md border border-white/10">
                          <span className="w-6 text-[9px] font-black uppercase tracking-widest text-gray-400">P</span> 
                          <span>{profile.phone}</span>
                       </div>
                    )}
                 </div>
              </div>
            </div>

          </CardContent>
        </Card>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
