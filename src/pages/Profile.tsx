import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { updateDoc, doc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'motion/react';
import { User, Mail, Phone, FileText, Settings as SettingsIcon, AtSign, Clock, Check, Briefcase, GraduationCap, Building2, Laptop, MoreHorizontal, X } from 'lucide-react';

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

const getTierSuffix = (tier: string) => {
  switch (tier) {
    case 'growth_consultant': return 'gc';
    case 'growth_principal': return 'gpl';
    case 'growth_partner': return 'gp';
    default: return 'na';
  }
};

export function Profile() {
  const { user, profile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: profile?.pendingUpdate?.name || profile?.name || '',
    phone: profile?.pendingUpdate?.phone || profile?.phone || '',
    tier: profile?.tier || 'growth_consultant',
    canIdPrefix: profile?.pendingUpdate?.canIdPrefix || profile?.canIdPrefix || (profile?.name ? profile.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : ''),
    documentUrl: profile?.pendingUpdate?.documentUrl || profile?.documentUrl || '',
    selectedCoes: profile?.pendingUpdate?.selectedCoes || profile?.selectedCoes || [] as string[],
    professionalStatus: profile?.pendingUpdate?.professionalStatus || profile?.professionalStatus || '',
    professionalDetails: profile?.pendingUpdate?.professionalDetails || profile?.professionalDetails || {} as any,
    experienceMonths: profile?.pendingUpdate?.experienceMonths || profile?.experienceMonths || '',
    whyJoin: profile?.pendingUpdate?.whyJoin || profile?.whyJoin || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update logic to react to tier changes etc
  const computedCanId = `${formData.canIdPrefix}.${getTierSuffix(formData.tier)}.can@big1cs`.toLowerCase();

  const toggleCoe = (coe: string) => {
     setFormData(prev => ({
        ...prev,
        selectedCoes: prev.selectedCoes.includes(coe) 
           ? prev.selectedCoes.filter(c => c !== coe)
           : [...prev.selectedCoes, coe]
     }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (formData.selectedCoes.length === 0) {
       setErrorMsg("Please select at least one Centre of Excellence (COE).");
       return;
    }
    setSaving(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      if (computedCanId !== profile.canId && computedCanId !== profile.pendingUpdate?.canId) {
        const q = query(collection(db, 'users'), where('canId', '==', computedCanId));
        const snapshot = await getDocs(q);
        const isTaken = snapshot.docs.some(doc => doc.id !== user.uid);
        
        if (isTaken) {
          setErrorMsg('This C.A.N. ID is already taken. Please choose a different prefix.');
          setSaving(false);
          return;
        }
      }

      // 1. Submit pending update
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        pendingUpdate: {
          name: formData.name,
          phone: formData.phone,
          canIdPrefix: formData.canIdPrefix,
          canId: computedCanId,
          documentUrl: formData.documentUrl,
          selectedCoes: formData.selectedCoes,
          professionalStatus: formData.professionalStatus,
          professionalDetails: formData.professionalDetails,
          experienceMonths: formData.experienceMonths,
          whyJoin: formData.whyJoin,
          updatedAt: Date.now()
        },
        rejectionRemarks: null,
        updatedAt: Date.now()
      });

      // 2. Notify admins
      const notificationRef = collection(db, 'notifications');
      await addDoc(notificationRef, {
        title: 'Profile Update Request',
        message: `${formData.name} requested changes to their profile.`,
        type: 'profile_update',
        readBy: [],
        createdAt: Date.now()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setSaving(false);
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

  const calculateProgress = () => {
    let completed = 0;
    const total = 7;
    if (formData.name.trim()) completed++;
    if (formData.phone.trim()) completed++;
    if (formData.selectedCoes.length > 0) completed++;
    if (formData.professionalStatus) completed++;
    if (formData.experienceMonths) completed++;
    if (formData.whyJoin.trim()) completed++;
    if (formData.documentUrl) completed++;
    return { percentage: Math.round((completed / total) * 100), completed, total };
  };

  const progress = calculateProgress();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">My Profile</h1>
        <p className="text-slate-400 font-medium mt-1">Manage your account information and preferences.</p>
        
        <div className="mt-6 bg-[#111827] p-5 rounded-xl border border-white/10 shadow-sm">
           <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Profile Completion</span>
              <span className="text-sm font-black text-brand-blue">{progress.percentage}%</span>
           </div>
           <div className="w-full bg-[#111827] h-2.5 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                 className="h-full bg-brand-blue rounded-full"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress.percentage}%` }}
                 transition={{ duration: 0.5, ease: "easeOut" }}
              />
           </div>
           <p className="text-[10px] text-gray-400 font-bold mt-2 text-right">{progress.completed} of {progress.total} sections completed</p>
        </div>
      </div>

      {profile?.pendingUpdate && (
        <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 rounded-xl flex items-start gap-3">
           <div className="bg-brand-yellow/20 p-2 rounded-full shrink-0">
             <Clock size={20} className="text-brand-yellow" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-white mb-1">Update Pending Approval</h3>
             <p className="text-xs text-slate-300 font-medium">Your recent profile changes are currently under review by an admin. They will be applied to your account once approved.</p>
           </div>
        </div>
      )}

      {profile?.rejectionRemarks && !profile?.pendingUpdate && profile?.status !== 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 shadow-inner">
           <div className="bg-red-500/20 p-2 rounded-full shrink-0">
             <X size={20} className="text-red-500" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-red-100 mb-1">Update Rejected</h3>
             <p className="text-xs text-red-200 font-medium">Your recent profile update request was rejected by an administrator.</p>
             <p className="text-[11px] text-red-300 font-bold tracking-wide mt-2 block bg-red-500/10 p-2 rounded-lg border border-red-500/20">Reason: {profile.rejectionRemarks}</p>
           </div>
        </div>
      )}

      <motion.div variants={container} initial="hidden" animate="show">
         <motion.div variants={item}>
            <Card className="border-white/10 shadow-sm overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-[100px] -z-10" />
               <CardHeader className="bg-[#111827]/50 border-b border-white/10 pb-6">
                  <CardTitle className="text-base font-black font-brand uppercase tracking-wide text-white flex items-center gap-2">
                     <SettingsIcon size={18} className="text-brand-blue" />
                     Personal Information
                  </CardTitle>
               </CardHeader>
               <form onSubmit={handleSubmit}>
                 <CardContent className="space-y-5 pt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5"><User size={12}/> Full Name</label>
                          <Input 
                             required 
                             value={formData.name} 
                             onChange={(e) => setFormData({...formData, name: e.target.value})} 
                             placeholder="Your full name"
                             className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue font-medium"
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5"><Phone size={12}/> Phone Number</label>
                          <Input 
                             required 
                             value={formData.phone} 
                             onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                             placeholder="Your phone number"
                             className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue font-medium"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5"><Mail size={12}/> Email Address</label>
                       <Input 
                          value={profile?.email || ''} 
                          disabled
                          className="h-11 bg-[#111827] border-white/10 text-slate-400 font-medium opacity-70"
                       />
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Email cannot be changed directly.</p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5"><AtSign size={12}/> Official C.A.N. ID</label>
                       <div className="flex items-center gap-2">
                         <Input 
                            required 
                            value={formData.canIdPrefix} 
                            onChange={(e) => setFormData({...formData, canIdPrefix: e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '')})} 
                            placeholder="firstname"
                            className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue font-medium"
                         />
                         <span className="text-sm font-bold text-slate-400 bg-[#111827] h-11 px-4 rounded-md flex items-center shrink-0 border border-white/10 select-none">
                           .{getTierSuffix(formData.tier)}.can@big1cs
                         </span>
                       </div>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex justify-between">
                         <span>Choose your unique ID prefix.</span>
                         <span className="text-white">Your ID: {computedCanId}</span>
                       </p>
                    </div>


                    <div className="space-y-3 pt-4 border-t border-white/10 mt-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Centre of Excellence (Select at least 1)</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {COE_OPTIONS.map(coe => (
                             <div
                                key={coe}
                                onClick={() => toggleCoe(coe)}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.selectedCoes.includes(coe) ? 'bg-brand-blue/5 border-brand-blue text-brand-blue' : 'bg-[#111827] border-white/10 text-slate-300 hover:border-brand-blue/50'}`}
                             >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.selectedCoes.includes(coe) ? 'bg-brand-blue border-brand-blue' : 'border-white/10'}`}>
                                   {formData.selectedCoes.includes(coe) && <Check size={14} className="text-white" />}
                                </div>
                                <span className="text-xs font-semibold">{coe}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Professional Status</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PRO_STATUS_OPTIONS.map((status) => {
                             const Icon = status.icon;
                             const isSelected = formData.professionalStatus === status.value;
                             return (
                                <div 
                                   key={status.value}
                                   onClick={() => setFormData({...formData, professionalStatus: status.value, professionalDetails: {}})}
                                   className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-brand-blue/5 border-brand-blue shadow-sm' : 'bg-[#111827] border-white/10 hover:border-brand-blue/30 hover:bg-[#111827]'}`}
                                >
                                   <div className={`p-2.5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-brand-blue border-brand-blue text-white' : 'bg-[#111827] border-white/10 text-slate-400'}`}>
                                      <Icon size={18} />
                                   </div>
                                   <div>
                                      <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{status.label}</h4>
                                      <p className="text-[10px] text-slate-400 font-medium mt-1">{status.description}</p>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>

                    <motion.div 
                       initial={false}
                       animate={{ height: formData.professionalStatus ? 'auto' : 0, opacity: formData.professionalStatus ? 1 : 0 }}
                       className="overflow-hidden"
                    >
                       {formData.professionalStatus === 'job' && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Current Employer / Company</label>
                             <Input required value={formData.professionalDetails.employer || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, employer: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Designation</label>
                             <Input required value={formData.professionalDetails.designation || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, designation: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Years of Experience</label>
                             <Input required type="number" value={formData.professionalDetails.experience || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, experience: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                       </div>
                    )}

                    {formData.professionalStatus === 'profession' && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Profession Type</label>
                             <Input required placeholder="e.g. CA, Lawyer, Architect" value={formData.professionalDetails.professionType || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, professionType: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Years of Practice</label>
                             <Input required type="number" value={formData.professionalDetails.practiceYears || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, practiceYears: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                       </div>
                    )}

                    {formData.professionalStatus === 'business' && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Business Name (Optional)</label>
                             <Input value={formData.professionalDetails.businessName || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, businessName: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Industry</label>
                             <Input required value={formData.professionalDetails.industry || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, industry: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Annual Turnover (Estimate)</label>
                             <Input required value={formData.professionalDetails.turnover || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, turnover: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                       </div>
                    )}

                    {formData.professionalStatus === 'freelancer' && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Primary Skill/Service</label>
                             <Input required value={formData.professionalDetails.primarySkill || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, primarySkill: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Years of Freelancing</label>
                             <Input required type="number" value={formData.professionalDetails.freelancingYears || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, freelancingYears: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                       </div>
                    )}

                    {formData.professionalStatus === 'other' && (
                       <div className="p-4 rounded-xl bg-[#111827] border border-white/10">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Please Specify Details</label>
                             <Input required value={formData.professionalDetails.otherDetails || ''} onChange={(e) => setFormData(p => ({...p, professionalDetails: {...p.professionalDetails, otherDetails: e.target.value}}))} className="h-10 text-sm bg-[#111827]" />
                          </div>
                       </div>
                    )}
                    </motion.div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">Experience in related field (in months)</label>
                       <Input 
                          required 
                          type="number"
                          value={formData.experienceMonths} 
                          onChange={(e) => setFormData({...formData, experienceMonths: e.target.value})} 
                          placeholder="e.g. 24"
                          className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue font-medium"
                       />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">Why do you want to be part of this?</label>
                       <textarea 
                          required 
                          value={formData.whyJoin} 
                          onChange={(e) => setFormData({...formData, whyJoin: e.target.value})} 
                          placeholder="Tell us about your motivation..."
                          className="flex w-full rounded-md border border-white/10 bg-[#111827]/50 px-3 py-3 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all min-h-[100px] resize-y"
                       />
                    </div>


                    <div className="space-y-2 pt-4 border-t border-white/10">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">Tier (Set at Signup)</label>
                       <select
                         disabled
                         value={formData.tier}
                         className="w-full h-11 bg-[#111827] border-white/10 rounded-md px-3 text-sm focus:ring-brand-blue/20 focus:border-brand-blue font-medium text-slate-400 opacity-70"
                       >
                         <option value="growth_consultant">Growth Consultant (Students & Freelancers)</option>
                         <option value="growth_principal">Growth Principal (Team Leaders & Experienced)</option>
                         <option value="growth_partner">Growth Partner (Firms & Agencies)</option>
                         <option value="n_a">N/A</option>
                       </select>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tier changes must be requested through support.</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/10/80 mt-4">
                       <div className="flex items-center gap-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue flex items-center gap-1.5"><FileText size={12} /> Document Verification Upload (Optional update)</label>
                       </div>
                       <p className="text-[11px] font-medium text-slate-400 leading-relaxed bg-brand-blue/5 p-3 rounded-md border border-brand-blue/10">Upload a new document (Image or PDF) containing your identity proof and qualifications for Admins to verify. Max size: 5MB.</p>
                       <Input 
                          type="file"
                          accept=".pdf,image/*"
                          onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (!file || !user) return;
                             if (file.size > 5 * 1024 * 1024) {
                                alert("File is too large (max 5MB).");
                                e.target.value = '';
                                return;
                             }
                             setSaving(true);
                             try {
                                const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                const { storage } = await import('../lib/firebase');
                                const fileRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
                                await uploadBytes(fileRef, file);
                                const url = await getDownloadURL(fileRef);
                                setFormData({...formData, documentUrl: url});
                             } catch (err) {
                                console.error(err);
                                alert("Failed to upload document. Please try a different file, or check permissions.");
                                e.target.value = '';
                             } finally {
                                setSaving(false);
                             }
                          }}
                          className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue pt-2.5 file:text-xs file:font-medium file:text-brand-blue file:bg-brand-blue/10 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 hover:file:bg-brand-blue/20 cursor-pointer"
                       />
                       {formData.documentUrl && (
                          <div className="flex items-center justify-between text-[10px] font-bold mt-2">
                             <a href={formData.documentUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">View Current Document</a>
                          </div>
                       )}
                    </div>
                 </CardContent>
                 <CardFooter className="bg-[#111827]/50 border-t border-white/10/80 pt-6 flex flex-col items-stretch gap-4">
                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-md border border-red-100">
                        {errorMsg}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      {success ? (
                         <span className="text-[10px] font-black uppercase tracking-widest text-brand-green">Profile updated successfully</span>
                      ) : (
                         <span className="text-[10px] font-bold text-gray-400">Admins will be notified of changes.</span>
                      )}
                      <Button 
                         type="submit" 
                         disabled={saving}
                         className="bg-brand-blue hover:bg-blue-800 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-sm shadow-brand-blue/20"
                      >
                         {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                 </CardFooter>
               </form>
            </Card>
         </motion.div>
      </motion.div>
    </motion.div>
  );
}
