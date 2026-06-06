import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Check, X, ShieldCheck, Eye, Download, User, Briefcase, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export function Approvals() {
  const { profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryUserId, setQueryUserId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryType, setQueryType] = useState<'text'|'document'>('text');

  const [actionModal, setActionModal] = useState<{ isOpen: boolean, type: 'suspend' | 'remove' | 'reject_app' | 'reject_update', user: any | null }>({ isOpen: false, type: 'suspend', user: null });
  const [viewUserModal, setViewUserModal] = useState<{ isOpen: boolean, user: any | null }>({ isOpen: false, user: null });
  const [remarks, setRemarks] = useState('');
  const [suspendUntil, setSuspendUntil] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
     return <div className="p-8">Unauthorized access.</div>;
  }

  useEffect(() => {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all: any[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingUsers(
        all
          .filter((u) => u.status === "pending" && u.role === "member")
          .sort((a, b) => b.createdAt - a.createdAt)
      );
      setPendingUpdates(
        all
          .filter((u) => u.status === "approved" && u.role === "member" && u.pendingUpdate != null)
          .sort((a, b) => b.pendingUpdate.updatedAt - a.pendingUpdate.updatedAt)
      );
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: status,
        updatedAt: Date.now()
      });
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  }

  const handleActionSubmit = async () => {
    if (!remarks.trim() || !actionModal.user) {
      alert('Remarks are mandatory.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { addDoc, deleteDoc } = await import("firebase/firestore");
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
      } else if (actionModal.type === 'reject_app') {
        const userRef = doc(db, 'users', actionModal.user.id);
        await updateDoc(userRef, {
          status: 'rejected',
          rejectionRemarks: remarks.trim(),
          updatedAt: Date.now()
        });
        await addDoc(collection(db, 'audit_logs'), {
          action: 'reject_application',
          userId: actionModal.user.id,
          userName: actionModal.user.name,
          remarks: remarks.trim(),
          timestamp: Date.now(),
          performedBy: profile?.email
        });
      } else if (actionModal.type === 'reject_update') {
        const userRef = doc(db, 'users', actionModal.user.id);
        await updateDoc(userRef, {
          pendingUpdate: null,
          rejectionRemarks: remarks.trim(),
          updatedAt: Date.now()
        });
        await addDoc(collection(db, 'audit_logs'), {
          action: 'reject_update',
          userId: actionModal.user.id,
          userName: actionModal.user.name,
          remarks: remarks.trim(),
          timestamp: Date.now(),
          performedBy: profile?.email
        });
      }
      
      setActionModal({ isOpen: false, type: 'suspend', user: null });
      setRemarks('');
      setSuspendUntil('');
    } catch (err) {
      console.error(err);
      alert(`Failed to ${actionModal.type} user. Check permissions.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuery = async (userId: string, user: any) => {
    if (!queryInput.trim()) return;
    try {
      const userRef = doc(db, 'users', userId);
      const newQuery = {
        id: Date.now().toString(),
        message: queryInput.trim(),
        queryType: queryType,
        createdAt: Date.now(),
        answered: false
      };
      await updateDoc(userRef, {
        adminQueries: [...(user.adminQueries || []), newQuery],
        updatedAt: Date.now()
      });
      setQueryInput('');
      setQueryType('text');
      setQueryUserId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleUpdateAction = async (userId: string, user: any, approved: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      if (approved && user.pendingUpdate) {
        await updateDoc(userRef, {
          name: user.pendingUpdate.name,
          phone: user.pendingUpdate.phone,
          canIdPrefix: user.pendingUpdate.canIdPrefix,
          canId: user.pendingUpdate.canId,
          documentUrl: user.pendingUpdate.documentUrl,
          pendingUpdate: null,
          updatedAt: Date.now()
        });
      } else {
        await updateDoc(userRef, {
          pendingUpdate: null,
          updatedAt: Date.now()
        });
      }
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  }

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
      <div>
        <div className="flex items-center gap-3 mb-2">
           <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-[0.2em]">Admin Panel</span>
        </div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">Member Approvals</h1>
        <p className="text-slate-400 mt-1 font-medium">Review, verify documents, and approve new C.A.N. members joining the network.</p>
      </div>

      <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden mb-8">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
             <div className="w-20 h-20 bg-[#111827] flex items-center justify-center rounded-full mb-6 border border-white/10 shadow-inner">
                <ShieldCheck className="text-gray-300" size={36} />
             </div>
             <p className="font-black text-xl text-white mb-2 font-brand tracking-wide">All caught up!</p>
             <p className="text-slate-400 font-medium max-w-sm">No pending member approvals at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 bg-[#111827] uppercase tracking-widest font-bold border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Requested Tier</th>
                  <th className="px-6 py-4">Verification Docs</th>
                  <th className="px-6 py-4">Date Applied</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-gray-100"
              >
                {pendingUsers.map((u) => (
                  <React.Fragment key={`user-${u.id}`}>
                  <motion.tr variants={item} className="hover:bg-brand-blue/5 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="font-bold text-white">{u.name}</div>
                       <div className="text-slate-400 font-medium text-xs mt-0.5">{u.email}</div>
                       {u.phone && <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">{u.phone}</div>}
                    </td>
                    <td className="px-6 py-5">
                       <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200">
                           {u.tier?.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       {u.documentUrl ? (
                          <a href={u.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-brand-blue hover:text-blue-800 font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap bg-brand-blue/5 px-3 py-1.5 rounded-md border border-brand-blue/20 hover:border-brand-blue">
                             <span className="mr-2 opacity-70">📄</span> View Docs
                          </a>
                       ) : (
                          <span className="text-gray-400 italic text-xs font-medium">Not provided</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-medium text-xs">
                      {format(u.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2 transition-opacity">
                          <Button size="sm" variant="outline" className="text-brand-blue hover:text-white border-white/5 bg-[#0A0E1A]/80 shadow-sm font-bold uppercase tracking-wider text-[10px]" onClick={() => setViewUserModal({ isOpen: true, user: u })}>
                             <Eye size={14} className="mr-1" /> View Profile
                          </Button>
                          <Button size="sm" variant="outline" className="text-slate-400 hover:text-gray-700 border-white/5 bg-[#0A0E1A]/80 font-bold uppercase tracking-wider text-[10px]" onClick={() => setQueryUserId(queryUserId === u.id ? null : u.id)}>
                             Raise Query
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 bg-[#0A0E1A]/80 shadow-sm font-bold uppercase tracking-wider text-[10px]" onClick={() => setActionModal({ isOpen: true, type: 'reject_app', user: u })}>
                             <X size={14} className="mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="bg-brand-green hover:bg-green-700 text-white shadow-sm shadow-brand-green/20 font-bold uppercase tracking-wider text-[10px]" onClick={() => handleAction(u.id, 'approved')}>
                             <Check size={14} className="mr-1" /> Approve
                          </Button>
                       </div>
                    </td>
                  </motion.tr>
                  {queryUserId === u.id && (
                     <tr>
                        <td colSpan={5} className="bg-[#111827] p-4 border-b border-white/10">
                           <div className="flex gap-2 max-w-2xl ml-auto">
                              <select
                                 value={queryType}
                                 onChange={(e: any) => setQueryType(e.target.value)}
                                 className="h-9 rounded-md border border-white/5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-[#0A0E1A]/80"
                              >
                                 <option value="text">Text Response</option>
                                 <option value="document">Document Upload</option>
                              </select>
                              <input 
                                 type="text"
                                 className="flex-1 h-9 rounded-md border border-white/5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                 placeholder={queryType === 'document' ? "Describe the document you need..." : "Ask for more info..."}
                                 value={queryInput}
                                 onChange={(e) => setQueryInput(e.target.value)}
                              />
                              <Button size="sm" onClick={() => handleSubmitQuery(u.id, u)}>Send Query</Button>
                           </div>
                        </td>
                     </tr>
                  )}
                  {u.adminQueries && u.adminQueries.length > 0 && (
                     <tr>
                        <td colSpan={5} className="bg-brand-yellow/5 p-4 border-b border-brand-yellow/10">
                           <div className="space-y-2 text-xs text-slate-300">
                              <div className="font-bold text-brand-yellow border-b border-brand-yellow/10 pb-1 mb-2 uppercase tracking-wide text-[10px]">Previous Queries</div>
                              {u.adminQueries.map((q: any) => (
                                 <div key={q.id} className="flex justify-between items-start">
                                    <div className="font-medium flex-1 pr-4 text-white">
                                       <span className="uppercase text-[9px] font-bold text-slate-500 mr-2 tracking-wider">[{q.queryType || 'text'}]</span>
                                       {q.message}
                                    </div>
                                    <div className="text-slate-400 w-1/3 italic">
                                       {q.answered ? (
                                          <span className="text-brand-green font-medium not-italic">
                                             {q.queryType === 'document' ? (
                                                <a href={q.answer} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline font-bold bg-brand-blue/10 px-2 py-1 rounded">📄 View Uploaded Document</a>
                                             ) : (
                                                `Answer: ${q.answer}`
                                             )}
                                          </span>
                                       ) : <span className="text-brand-yellow/50">Waiting for user...</span>}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </td>
                     </tr>
                  )}
                  </React.Fragment>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-black font-brand tracking-tight text-white mb-4">Profile Update Requests</h2>
      </div>

      <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>
        ) : pendingUpdates.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
             <div className="w-20 h-20 bg-[#111827] flex items-center justify-center rounded-full mb-6 border border-white/10 shadow-inner">
                <ShieldCheck className="text-gray-300" size={36} />
             </div>
             <p className="font-black text-xl text-white mb-2 font-brand tracking-wide">All caught up!</p>
             <p className="text-slate-400 font-medium max-w-sm">No pending profile updates at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 bg-[#111827] uppercase tracking-widest font-bold border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Changes Requested</th>
                  <th className="px-6 py-4">Verification Docs</th>
                  <th className="px-6 py-4">Date Applied</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-gray-100"
              >
                {pendingUpdates.map((u) => (
                  <motion.tr variants={item} key={`update-${u.id}`} className="hover:bg-brand-yellow/5 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="text-xs text-slate-400 mb-1">Current Name: <span className="font-bold text-white">{u.name}</span></div>
                       <div className="text-xs text-brand-blue font-bold">New Name: {u.pendingUpdate.name}</div>
                       <div className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-bold">New ID: {u.pendingUpdate.canId}</div>
                    </td>
                    <td className="px-6 py-5">
                       {u.pendingUpdate.documentUrl ? (
                          <a href={u.pendingUpdate.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-brand-blue hover:text-blue-800 font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap bg-brand-blue/5 px-3 py-1.5 rounded-md border border-brand-blue/20 hover:border-brand-blue">
                             <span className="mr-2 opacity-70">📄</span> View New Docs
                          </a>
                       ) : (
                          <span className="text-gray-400 italic text-xs font-medium">None</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-medium text-xs">
                      {format(u.pendingUpdate.updatedAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2 transition-opacity">
                          <Button size="sm" variant="outline" className="text-brand-blue hover:text-white border-white/5 bg-[#0A0E1A]/80 shadow-sm font-bold uppercase tracking-wider text-[10px]" onClick={() => setViewUserModal({ isOpen: true, user: u })}>
                             <Eye size={14} className="mr-1" /> View Profile
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 bg-[#0A0E1A]/80 shadow-sm font-bold uppercase tracking-wider text-[10px]" onClick={() => setActionModal({ isOpen: true, type: 'reject_update', user: u })}>
                             <X size={14} className="mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="bg-brand-green hover:bg-green-700 text-white shadow-sm shadow-brand-green/20 font-bold uppercase tracking-wider text-[10px]" onClick={() => handleUpdateAction(u.id, u, true)}>
                             <Check size={14} className="mr-1" /> Approve
                          </Button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111827] rounded-xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden">
            <div className={`p-4 border-b border-white/10 ${(actionModal.type === 'remove' || actionModal.type === 'reject_app' || actionModal.type === 'reject_update') ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
              <h3 className="text-lg font-black font-brand text-white">
                {actionModal.type === 'remove' ? 'Remove Member' : actionModal.type.startsWith('reject') ? 'Reject Application' : 'Suspend Member'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300">
                Are you sure you want to {actionModal.type === 'reject_app' ? 'reject' : actionModal.type === 'reject_update' ? 'reject the update for' : actionModal.type} <strong>{actionModal.user?.name}</strong>?
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Remarks / Reason (Mandatory)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                  rows={3}
                  placeholder="Explain the reason for this action..."
                  required
                />
              </div>

              {actionModal.type === 'suspend' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Suspend Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={suspendUntil}
                    onChange={(e) => setSuspendUntil(e.target.value)}
                    className="w-full bg-[#0A0E1A] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Leave empty to suspend indefinitely.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-[#0A0E1A] border-t border-white/10 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setActionModal({ isOpen: false, type: 'suspend', user: null })}
                className="text-slate-400 border-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleActionSubmit}
                disabled={!remarks.trim() || isSubmitting}
                className={(actionModal.type === 'remove' || actionModal.type.startsWith('reject')) ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${(actionModal.type === 'reject_app' || actionModal.type === 'reject_update') ? 'Rejection' : actionModal.type}`}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {viewUserModal.isOpen && viewUserModal.user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111827] rounded-xl shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-white/10 bg-[#0A0E1A] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black font-brand text-white">
                  Member Profile
                </h3>
                <p className="text-xs text-slate-400">{viewUserModal.user.name} ({viewUserModal.user.email})</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewUserModal({ isOpen: false, user: null })}>
                <X className="text-slate-400 h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto w-full">
               {/* Pending Updates Warning */}
               {viewUserModal.user.pendingUpdate && (
                  <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                     <div>
                       <h4 className="text-brand-yellow font-bold text-[10px] uppercase tracking-wider mb-2">Pending Profile Update</h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                             <div className="text-slate-400 text-xs">Current Name</div>
                             <div className="text-white font-medium">{viewUserModal.user.name}</div>
                          </div>
                          <div>
                             <div className="text-slate-400 text-xs">New Name</div>
                             <div className="text-brand-yellow font-bold">{viewUserModal.user.pendingUpdate.name}</div>
                          </div>
                          <div>
                             <div className="text-slate-400 text-xs">Current Document</div>
                             {viewUserModal.user.documentUrl ? (
                                <a href={viewUserModal.user.documentUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-xs">View Document</a>
                             ) : <span className="text-slate-500 text-xs">None</span>}
                          </div>
                          <div>
                             <div className="text-slate-400 text-xs">New Document</div>
                             {viewUserModal.user.pendingUpdate.documentUrl ? (
                                <a href={viewUserModal.user.pendingUpdate.documentUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-xs">View New Document</a>
                             ) : <span className="text-slate-500 text-xs">None</span>}
                          </div>
                       </div>
                     </div>
                  </div>
               )}

               <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-[#111827]/50 border-b border-white/10 p-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5"><User size={12} className="text-brand-blue"/> Personal Information</h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Full Name</label>
                        <div className="text-sm font-medium text-white">{viewUserModal.user.name}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Phone</label>
                        <div className="text-sm font-medium text-white">{viewUserModal.user.phone || 'N/A'}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                        <div className="text-sm font-medium text-white">{viewUserModal.user.email}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Tier</label>
                        <div className="inline-block bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{viewUserModal.user.tier?.replace('_', ' ')}</div>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">C.A.N. ID</label>
                        <div className="text-sm font-medium text-brand-blue select-all">{viewUserModal.user.canId || 'Not Set'}</div>
                      </div>
                    </div>
                  </div>

                  {/* COE List */}
                  <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-[#111827]/50 border-b border-white/10 p-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5"><Check size={12} className="text-brand-blue"/> Center of Excellence (COE)</h4>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                       {viewUserModal.user.selectedCoes?.length > 0 ? viewUserModal.user.selectedCoes.map((coe: string) => (
                          <span key={coe} className="bg-brand-blue/5 text-slate-300 border border-brand-blue/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
                            {coe}
                          </span>
                       )) : <span className="text-slate-500 text-xs">None Selected</span>}
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-[#111827]/50 border-b border-white/10 p-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5"><Briefcase size={12} className="text-brand-blue"/> Professional Details</h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Status</label>
                        <div className="text-sm font-medium text-white capitalize">{viewUserModal.user.professionalStatus || 'N/A'}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Experience</label>
                        <div className="text-sm font-medium text-white">{viewUserModal.user.experienceMonths ? `${Math.floor(viewUserModal.user.experienceMonths / 12)} years, ${viewUserModal.user.experienceMonths % 12} months` : 'N/A'}</div>
                      </div>
                      {viewUserModal.user.professionalDetails && typeof viewUserModal.user.professionalDetails === 'object' && Object.keys(viewUserModal.user.professionalDetails).length > 0 && (
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                           {Object.entries(viewUserModal.user.professionalDetails).map(([key, value]) => (
                              <div key={key} className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
                                 <label className="text-[9px] font-bold text-slate-400 capitalize uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                 <div className="text-sm text-white">{String(value)}</div>
                              </div>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Why Join */}
                  {viewUserModal.user.whyJoin && (
                    <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                      <div className="bg-[#111827]/50 border-b border-white/10 p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Why Join</h4>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {viewUserModal.user.whyJoin}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Document */}
                  {viewUserModal.user.documentUrl && (
                    <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                      <div className="bg-[#111827]/50 border-b border-white/10 p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5"><FileText size={12} className="text-brand-blue"/> Document Verification</h4>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="bg-brand-blue/10 p-2 rounded-lg text-brand-blue">
                               <FileText size={20} />
                            </div>
                            <div>
                               <div className="text-sm font-bold text-white">Identity / Verification Document</div>
                               <div className="text-xs font-medium text-slate-400">View or download the uploaded document</div>
                            </div>
                         </div>
                         <a href={viewUserModal.user.documentUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white font-bold uppercase tracking-wider text-[10px]">
                               <Download size={12} className="mr-2" /> View File
                            </Button>
                         </a>
                      </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-4 bg-[#0A0E1A] border-t border-white/10 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setViewUserModal({ isOpen: false, user: null })}
                className="text-slate-400 border-white/10"
              >
                Close
              </Button>
               {viewUserModal.user.pendingUpdate ? (
                  <>
                    <Button 
                      onClick={() => { setActionModal({ isOpen: true, type: 'reject_update', user: viewUserModal.user }); setViewUserModal({ isOpen: false, user: null }); }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X size={14} className="mr-1" /> Reject Update
                    </Button>
                    <Button 
                      onClick={() => { handleUpdateAction(viewUserModal.user.id, viewUserModal.user, true); setViewUserModal({ isOpen: false, user: null }); }}
                      className="bg-brand-green hover:bg-green-700 text-white"
                    >
                      <Check size={14} className="mr-1" /> Approve Update
                    </Button>
                  </>
               ) : (
                  <>
                    <Button 
                      onClick={() => { setActionModal({ isOpen: true, type: 'reject_app', user: viewUserModal.user }); setViewUserModal({ isOpen: false, user: null }); }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X size={14} className="mr-1" /> Reject Application
                    </Button>
                    <Button 
                      onClick={() => { handleAction(viewUserModal.user.id, 'approved'); setViewUserModal({ isOpen: false, user: null }); }}
                      className="bg-brand-green hover:bg-green-700 text-white"
                    >
                      <Check size={14} className="mr-1" /> Approve Application
                    </Button>
                  </>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
