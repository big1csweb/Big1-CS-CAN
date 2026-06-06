import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format } from 'date-fns';
import { Search, Users, AlertTriangle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

export function Directory() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [actionModal, setActionModal] = useState<{ isOpen: boolean, type: 'suspend' | 'remove', user: any | null }>({ isOpen: false, type: 'suspend', user: null });
  const [remarks, setRemarks] = useState('');
  const [suspendUntil, setSuspendUntil] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
     return <div className="p-8">Unauthorized access. Admins only.</div>;
  }

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleActionSubmit = async () => {
    if (!remarks.trim() || !actionModal.user) {
      alert('Remarks are mandatory.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (actionModal.type === 'suspend') {
        const userRef = doc(db, 'users', actionModal.user.id);
        await updateDoc(userRef, { 
          status: 'suspended', 
          updatedAt: Date.now(),
          suspensionRemarks: remarks.trim(),
          suspendedUntil: suspendUntil ? new Date(suspendUntil).getTime() : null,
          suspendedBy: profile?.email || 'Admin'
        });
        
        await addDoc(collection(db, 'audit_logs'), {
          action: 'suspend_user',
          userId: actionModal.user.id,
          userName: actionModal.user.name,
          remarks: remarks.trim(),
          suspendedUntil: suspendUntil ? new Date(suspendUntil).getTime() : null,
          timestamp: Date.now(),
          performedBy: profile?.email
        });
      } else if (actionModal.type === 'remove') {
        await addDoc(collection(db, 'audit_logs'), {
          action: 'remove_user',
          userId: actionModal.user.id,
          userName: actionModal.user.name,
          remarks: remarks.trim(),
          timestamp: Date.now(),
          performedBy: profile?.email
        });
        const userRef = doc(db, 'users', actionModal.user.id);
        await deleteDoc(userRef);
      }
      
      setActionModal({ isOpen: false, type: 'suspend', user: null });
      setRemarks('');
      setSuspendUntil('');
    } catch (err) {
      console.error(err);
      alert(`Failed to ${actionModal.type} user.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter(m => 
     m.name?.toLowerCase().includes(search.toLowerCase()) || 
     m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-[0.2em]">Admin Panel</span>
           </div>
          <h1 className="text-3xl font-black font-brand tracking-tight text-white">C.A.N. Members Directory</h1>
          <p className="text-slate-400 font-medium mt-1">View all approved members in the network.</p>
        </div>
        <div className="relative w-full sm:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <Input 
              placeholder="Search members..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-white/5 focus:ring-brand-blue/20 focus:border-brand-blue"
           />
        </div>
      </div>

      <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
             <div className="w-20 h-20 bg-[#111827] flex items-center justify-center rounded-full mb-6 border border-white/10 shadow-inner">
                <Users className="text-gray-300" size={36} />
             </div>
             <p className="font-black text-xl text-white mb-2 font-brand tracking-wide">No members found</p>
             <p className="text-slate-400 font-medium max-w-sm">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 bg-[#111827] uppercase tracking-widest font-bold border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Tier / C.A.N. ID</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-gray-100"
              >
                {filteredMembers.map((m) => (
                  <motion.tr variants={item} key={m.id} className="hover:bg-brand-blue/5 transition-colors group cursor-default">
                    <td className="px-6 py-5">
                       <div className="font-bold text-white">{m.name}</div>
                       <div className="text-slate-400 font-medium text-xs mt-0.5">{m.email}</div>
                       {m.phone && <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">{m.phone}</div>}
                    </td>
                    <td className="px-6 py-5">
                       {m.role === 'super_admin' ? (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-purple-200">Super Admin</span>
                       ) : m.role === 'admin' ? (
                          <span className="bg-brand-blue/20 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-brand-blue/30">Admin</span>
                       ) : (
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/5">Member</span>
                       )}
                    </td>
                    <td className="px-6 py-5 flex flex-col items-start gap-2">
                       <span className="inline-block bg-brand-yellow/20 text-amber-900 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-brand-yellow/40">
                           {m.tier?.replace('_', ' ') || 'N/A'}
                       </span>
                       {m.canId && (
                           <span className="font-mono text-[10px] font-bold text-slate-400 bg-gray-100 px-2 py-0.5 rounded">
                             {m.canId}
                           </span>
                       )}
                       {m.invitedBy && (
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-1">
                           Mapped to: <span className="text-brand-blue">{members.find(x => x.id === m.invitedBy)?.name || m.invitedBy}</span>
                         </div>
                       )}
                       {m.tier === 'growth_partner' && members.filter(x => x.invitedBy === m.id).length > 0 && (
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-1">
                           Team Size: <span className="text-brand-blue">{members.filter(x => x.invitedBy === m.id).length}</span>
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-medium text-xs">
                      {format(m.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2 transition-opacity">
                          {(profile?.role === 'admin' || profile?.role === 'super_admin') && m.role !== 'super_admin' && (
                            <>
                            <button
                               onClick={() => setActionModal({ isOpen: true, type: 'suspend', user: m })}
                               className="text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-700 bg-[#0A0E1A]/80 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-md shadow-sm transition-colors"
                            >
                               Suspend
                            </button>
                            <button
                               onClick={() => setActionModal({ isOpen: true, type: 'remove', user: m })}
                               className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 bg-[#0A0E1A]/80 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md shadow-sm transition-colors"
                            >
                               Remove
                            </button>
                            </>
                          )}
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0E1A] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 bg-[#111827]/50">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <AlertTriangle className={actionModal.type === 'suspend' ? "text-amber-500" : "text-red-500"} size={20} />
                {actionModal.type === 'suspend' ? 'Suspend User' : 'Remove User'}
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                {actionModal.type === 'suspend' ? 
                  `You are about to suspend ${actionModal.user?.name}. Please provide mandatory remarks and optionally a date until the suspension lasts.` : 
                  `This action will permanently remove ${actionModal.user?.name} from the network. This cannot be undone. Please provide mandatory remarks.`
                }
              </p>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Remarks (Mandatory) *</label>
                <Input 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={`Reason for ${actionModal.type}...`}
                  className="bg-[#111827] border-white/10 focus:border-brand-blue"
                />
              </div>
              
              {actionModal.type === 'suspend' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Suspend Until (Optional)</label>
                  <Input 
                    type="date"
                    value={suspendUntil}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSuspendUntil(e.target.value)}
                    className="bg-[#111827] border-white/10 focus:border-brand-blue"
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#111827]/30 flex justify-end gap-2">
               <Button
                type="button"
                variant="outline"
                onClick={() => setActionModal({ isOpen: false, type: 'suspend', user: null })}
                className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || !remarks.trim()}
                onClick={handleActionSubmit}
                className={actionModal.type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent' : 'bg-red-600 hover:bg-red-700 text-white border-transparent'}
              >
                {isSubmitting ? 'Processing...' : actionModal.type === 'suspend' ? 'Confirm Suspension' : 'Confirm Removal'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
