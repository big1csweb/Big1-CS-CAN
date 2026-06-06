import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Plus, Search, ChevronRight, Activity } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";

export function LeadsList() {
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    let q;
    const leadsRef = collection(db, "leads");
    if (profile?.role === "admin" || profile?.role === "super_admin") {
      q = query(leadsRef, orderBy("createdAt", "desc"));
    } else {
      q = query(
        leadsRef,
        where("memberId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leadsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeads(leadsData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "leads");
      },
    );

    return () => unsubscribe();
  }, [user, profile]);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.coe.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      prospect: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      confirmed: "bg-brand-green/10 text-brand-green border-brand-green/20",
      // Legacy
      new: "bg-blue-100 text-blue-800 border-blue-200",
      contacted: "bg-yellow-100 text-yellow-800 border-yellow-300",
      document_collection: "bg-purple-100 text-purple-800 border-purple-200",
      processing: "bg-orange-100 text-orange-800 border-orange-200",
      completed: "bg-brand-green/20 text-green-800 border-brand-green/30",
      lost: "bg-red-100 text-red-800 border-red-200",
      follow_up: "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20",
      closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return colors[status] || "bg-gray-100/10 text-slate-400 border-white/5";
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      not_contacted: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      follow_up: "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20",
      closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return colors[action] || "bg-gray-100/10 text-slate-400 border-white/5";
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-brand tracking-tight text-white">
            Leads Pipeline
          </h1>
          <p className="text-slate-400 font-medium">
            Manage and track customer interactions and CoEs cases.
          </p>
        </div>
        <Link to="/leads/new">
          <Button className="flex items-center gap-2 bg-brand-blue hover:bg-blue-800 text-white shadow-md shadow-brand-blue/20 transition-all font-bold uppercase tracking-wider text-xs">
            <Plus size={16} /> Lodge New Lead
          </Button>
        </Link>
      </div>

      <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-[#111827]">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0A0E1A]/80 border-white/5 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#111827] rounded-full flex items-center justify-center mb-4 border border-white/10 text-gray-300">
              <Activity size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              No leads found
            </h3>
            <p className="text-slate-400 max-w-sm font-medium">
              You haven't added any leads to your pipeline yet, or your search
              produced no results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 bg-[#111827] uppercase tracking-widest font-bold border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Centre of Excellence</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Lodged</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <motion.tbody
                variants={container}
                initial="hidden"
                animate="show"
                className="divide-y divide-gray-100"
              >
                {filteredLeads.map((lead) => (
                  <motion.tr
                    variants={item}
                    key={lead.id}
                    className="hover:bg-brand-blue/5 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-5">
                      <span className="font-bold text-white">
                        {lead.clientName}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-medium capitalize text-slate-300">
                      {lead.coe}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusColor(lead.status)}`}
                        >
                          {lead.status?.replace("_", " ")}
                        </span>
                        {lead.action && (
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getActionColor(lead.action)}`}
                          >
                            {lead.action?.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-medium text-xs">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="inline-flex items-center text-brand-blue opacity-0 group-hover:opacity-100 hover:text-blue-800 font-bold text-[10px] uppercase tracking-widest transition-all"
                      >
                        View Details{" "}
                        <ChevronRight size={14} className="ml-1 -mt-0.5" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
