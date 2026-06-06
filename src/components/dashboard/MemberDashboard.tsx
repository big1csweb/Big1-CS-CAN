import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { motion } from "motion/react";
import {
  Briefcase,
  Activity,
  IndianRupee,
  Award,
  ArrowUpRight,
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

export function MemberDashboard() {
  const { profile, user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activePipeline: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (!user) return;

    const leadsQ = query(
      collection(db, "leads"),
      where("memberId", "==", user.uid),
    );
    const unsubscribeLeads = onSnapshot(leadsQ, (snapshot) => {
      let total = 0;
      let active = 0;
      snapshot.docs.forEach((doc) => {
        total++;
        const data = doc.data();
        if (data.status !== "completed" && data.status !== "lost") {
          active++;
        }
      });
      setMetrics((prev) => ({
        ...prev,
        totalLeads: total,
        activePipeline: active,
      }));
    });

    const earningsQ = query(
      collection(db, "earnings"),
      where("memberId", "==", user.uid),
    );
    const unsubscribeEarnings = onSnapshot(earningsQ, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        total += doc.data().amount || 0;
      });
      setMetrics((prev) => ({ ...prev, totalEarnings: total }));
    });

    return () => {
      unsubscribeLeads();
      unsubscribeEarnings();
    };
  }, [user]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">
          Member Home
        </h1>
        <p className="text-slate-400 font-medium">
          Welcome back, {profile?.name}. Here is your performance overview.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-blue/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Total Leads
            </h3>
            <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.totalLeads}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-yellow/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Active Pipeline
            </h3>
            <div className="p-2 bg-brand-yellow/20 text-yellow-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.activePipeline}
          </div>
          <div className="mt-2 flex items-center text-xs font-semibold text-gray-400 relative z-10">
            Deals in progress
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-green/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Total Earnings
            </h3>
            <div className="p-2 bg-brand-green/20 text-brand-green rounded-lg">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            ₹{metrics.totalEarnings.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-dark/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Your Tier
            </h3>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Award size={20} />
            </div>
          </div>
          <div className="text-lg font-black text-brand-dark capitalize leading-tight relative z-10">
            {profile?.tier?.replace("_", " ")}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
