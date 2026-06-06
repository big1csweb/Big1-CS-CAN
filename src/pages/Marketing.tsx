import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { collection, query, onSnapshot, orderBy, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileText, Download, Link as LinkIcon, Trash, Megaphone, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export function Marketing() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    const q = query(collection(db, 'marketing_materials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'marketing_materials');
    });
    return () => unsubscribe();
  }, []);

  const handleAddMaterial = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!title.trim() || !url.trim()) return;
     try {
       await addDoc(collection(db, 'marketing_materials'), {
         title,
         url,
         description,
         createdAt: Date.now()
       });
       setTitle('');
       setUrl('');
       setDescription('');
     } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'marketing_materials');
     }
  };

  const handleDelete = async (id: string) => {
     try {
        await deleteDoc(doc(db, 'marketing_materials', id));
     } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `marketing_materials/${id}`);
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
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">Marketing Materials</h1>
        <p className="text-slate-400 font-medium mt-1">Access brochures, flyers, and sales assets to share with clients.</p>
      </div>

      {isAdmin && (
         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-white/10 shadow-sm bg-[#0A0E1A]/80 overflow-hidden">
               <div className="bg-brand-blue/5 border-b border-brand-blue/10 px-6 py-4 flex items-center gap-3">
                  <div className="bg-brand-blue/10 p-2 rounded-lg text-brand-blue">
                     <Plus size={20} />
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight text-white">Add New Material</CardTitle>
               </div>
               <form onSubmit={handleAddMaterial}>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Title</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Wealth Management Brochure" className="border-white/5 focus:ring-brand-blue/20 focus:border-brand-blue" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Link / URL</label>
                        <Input value={url} onChange={e => setUrl(e.target.value)} required type="url" placeholder="https://..." className="border-white/5 focus:ring-brand-blue/20 focus:border-brand-blue" />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Description (Optional)</label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview of the material..." className="border-white/5 focus:ring-brand-blue/20 focus:border-brand-blue" />
                     </div>
                  </CardContent>
                  <CardFooter className="bg-[#111827] border-t border-white/5 mt-4 pt-6">
                     <Button type="submit" className="bg-brand-blue hover:bg-blue-800 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-brand-blue/20">Upload Material</Button>
                  </CardFooter>
               </form>
            </Card>
         </motion.div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>
      ) : (
         <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
         >
            {materials.map(mat => (
               <motion.div variants={item} key={mat.id} className="h-full">
                  <Card className="flex flex-col h-full border-white/10 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
                     <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-start justify-between gap-4 leading-tight">
                           <span className="flex items-start gap-3 font-bold text-white">
                              <div className="bg-brand-yellow/20 p-2 rounded-lg text-yellow-600 shrink-0 mt-0.5 group-hover:bg-brand-yellow group-hover:text-amber-900 transition-colors">
                                 <FileText size={18} />
                              </div>
                              {mat.title}
                           </span>
                           {isAdmin && (
                              <button onClick={() => handleDelete(mat.id)} className="text-red-400 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-md transition-colors shrink-0">
                                 <Trash size={16} />
                              </button>
                           )}
                        </CardTitle>
                        {mat.description && <p className="text-sm text-slate-400 mt-3 font-medium line-clamp-2">{mat.description}</p>}
                     </CardHeader>
                     <CardContent className="mt-auto pt-4 border-t border-white/5">
                        <a href={mat.url} target="_blank" rel="noreferrer" className="block w-full">
                           <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-brand-blue border-brand-blue/20 bg-brand-blue/5 hover:bg-brand-blue hover:text-white transition-all font-bold tracking-wide">
                              <LinkIcon size={16} /> Open Resource
                           </Button>
                        </a>
                     </CardContent>
                  </Card>
               </motion.div>
            ))}
            {materials.length === 0 && (
               <div className="col-span-full p-16 flex flex-col items-center justify-center text-center bg-[#0A0E1A]/80 rounded-2xl border border-white/10 shadow-sm">
                  <div className="w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center mb-6 border border-white/10 text-gray-300">
                     <Megaphone size={40} />
                  </div>
                  <h3 className="text-xl font-black font-brand text-white mb-2">No materials available</h3>
                  <p className="text-slate-400 max-w-sm font-medium">Marketing materials will appear here once they are uploaded by an administrator.</p>
               </div>
            )}
         </motion.div>
      )}
    </motion.div>
  );
}
