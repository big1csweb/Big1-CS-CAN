import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isAfter,
} from "date-fns";
import { motion } from "motion/react";
import {
  IndianRupee,
  Activity,
  PiggyBank,
  TrendingUp,
  BarChart3,
  Plus,
  X,
} from "lucide-react";

export function Earnings() {
  const { user, profile } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newEarning, setNewEarning] = useState({ leadId: "", amount: "" });

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  useEffect(() => {
    if (!user) return;

    let q;
    const earningsRef = collection(db, "earnings");
    let unsubLeads: any;
    if (isAdmin) {
      q = query(earningsRef, orderBy("date", "desc"));

      const leadsRef = collection(db, "leads");
      const qLeads = query(leadsRef, orderBy("createdAt", "desc"));
      unsubLeads = onSnapshot(qLeads, (snapshot) => {
        setAllLeads(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      });
    } else {
      q = query(
        earningsRef,
        where("memberId", "==", user.uid),
        orderBy("date", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEarnings(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "earnings");
      },
    );

    return () => {
      unsubscribe();
      if (unsubLeads) unsubLeads();
    };
  }, [user, profile]);

  const handleAddEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEarning.leadId || !newEarning.amount) return;
    setIsAdding(true);

    const lead = allLeads.find((l) => l.id === newEarning.leadId);
    if (!lead) return;

    const payload = {
      amount: Number(newEarning.amount),
      date: Date.now(),
      clientName: lead.clientName,
      coe: lead.coe,
      memberId: lead.memberId,
      leadId: lead.id,
    };

    try {
      await addDoc(collection(db, "earnings"), payload);
      setShowAddForm(false);
      setNewEarning({ leadId: "", amount: "" });
    } catch (error) {
      console.error("Error adding earning", error);
    } finally {
      setIsAdding(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    let thisWeek = 0;
    let thisMonth = 0;
    let thisYear = 0;
    let total = 0;
    const coeBreakdown: Record<string, number> = {};

    earnings.forEach((e) => {
      total += e.amount;
      if (isAfter(e.date, startOfWeek(now))) thisWeek += e.amount;
      if (isAfter(e.date, startOfMonth(now))) thisMonth += e.amount;
      if (isAfter(e.date, startOfYear(now))) thisYear += e.amount;

      coeBreakdown[e.coe] = (coeBreakdown[e.coe] || 0) + e.amount;
    });

    return { thisWeek, thisMonth, thisYear, total, coeBreakdown };
  };

  const stats = calculateStats();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 },
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
            Earnings
          </h1>
          <p className="text-slate-400 font-medium">
            Track your generated revenue across leads and centers of excellence.
          </p>
        </div>
        {isAdmin && !showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white shadow-md font-bold uppercase tracking-wider text-xs"
          >
            <Plus size={16} /> Add Earning
          </Button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-brand-green/20 bg-brand-green/5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-white">
                Add New Earning Record
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleAddEarning}
                className="flex flex-col md:flex-row gap-4 items-start md:items-end"
              >
                <div className="space-y-2 flex-1 w-full">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Select Lead
                  </label>
                  <select
                    required
                    value={newEarning.leadId}
                    onChange={(e) =>
                      setNewEarning({ ...newEarning, leadId: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-brand-green/20 bg-[#111827] px-3 py-1 text-sm shadow-sm transition-colors text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green"
                  >
                    <option value="">-- Choose a Lead --</option>
                    {allLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.clientName} ({l.coe})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Amount (₹)
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={newEarning.amount}
                    onChange={(e) =>
                      setNewEarning({ ...newEarning, amount: e.target.value })
                    }
                    placeholder="e.g. 50000"
                    className="border-brand-green/20 bg-[#111827] focus-visible:ring-brand-green"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-full md:w-auto bg-brand-green hover:bg-brand-green/90 text-white font-bold uppercase tracking-wider text-xs"
                >
                  {isAdding ? "Saving..." : "Save Earning"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="border-white/10 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-blue/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                This Week
              </CardTitle>
              <IndianRupee size={16} className="text-brand-blue" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-white">
                ₹{stats.thisWeek.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-white/10 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-blue/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                This Month
              </CardTitle>
              <TrendingUp size={16} className="text-brand-blue" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-white">
                ₹{stats.thisMonth.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-white/10 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-yellow/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                This Year
              </CardTitle>
              <BarChart3 size={16} className="text-yellow-600" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-white">
                ₹{stats.thisYear.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-brand-green/20 bg-brand-green/5 shadow-sm hover:shadow-md hover:bg-brand-green/10 transition-all relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-green/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-brand-green uppercase tracking-wider">
                Total All Time
              </CardTitle>
              <PiggyBank size={16} className="text-brand-green" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-brand-green">
                ₹{stats.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-white/10 shadow-sm">
            <CardHeader className="border-b border-white/5 bg-[#111827]">
              <CardTitle className="text-base font-bold font-brand tracking-wide">
                Recent Earning Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
                </div>
              ) : earnings.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No earnings recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-400 bg-[#111827] uppercase tracking-widest font-bold border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">CoE</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {earnings.map((e) => (
                        <tr
                          key={e.id}
                          className="hover:bg-brand-blue/5 transition-colors group cursor-default"
                        >
                          <td className="px-6 py-4 text-xs font-medium text-slate-400">
                            {format(e.date, "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {e.clientName}
                          </td>
                          <td className="px-6 py-4 capitalize font-medium text-slate-300">
                            {e.coe}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-brand-green tracking-tight">
                            +₹{e.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-white/10 shadow-sm">
            <CardHeader className="border-b border-white/5 bg-[#111827]">
              <CardTitle className="text-base font-bold font-brand tracking-wide">
                By Centre of Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(stats.coeBreakdown).map(([coe, amount]) => (
                  <div
                    key={coe}
                    className="flex justify-between items-center group p-2 hover:bg-[#111827] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs">
                        {coe.charAt(0).toUpperCase()}
                      </div>
                      <span className="capitalize font-bold text-white">
                        {coe}
                      </span>
                    </div>
                    <span className="font-black text-white border-b-2 border-transparent group-hover:border-brand-blue transition-colors">
                      ₹{amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {Object.keys(stats.coeBreakdown).length === 0 && (
                  <div className="text-sm text-slate-400 text-center py-8 font-medium">
                    No data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
