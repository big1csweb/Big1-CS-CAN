import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { motion } from "motion/react";
import {
  Users,
  Shield,
  Database,
  Activity,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";

export function SuperAdminDashboard() {
  const { profile, user } = useAuth();
  const [metrics, setMetrics] = useState({
    superAdmins: 0,
    approvedAdmins: 0,
    pendingAdmins: 0,
    approvedMembers: 0,
    pendingMembers: 0,
    totalLeads: 0,
    totalRevenue: 0,
  });
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Total users breakdown
    const qUsers = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      let superAdmins = 0;
      let approvedAdmins = 0;
      let pendingAdmins = 0;
      let approvedMembers = 0;
      let pendingMembers = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.role === "super_admin") {
          superAdmins++;
        } else if (data.role === "admin") {
          if (data.status === "approved") approvedAdmins++;
          else pendingAdmins++;
        } else {
          if (data.status === "approved") approvedMembers++;
          else pendingMembers++;
        }
      });
      setMetrics((prev) => ({
        ...prev,
        superAdmins,
        approvedAdmins,
        pendingAdmins,
        approvedMembers,
        pendingMembers,
      }));
    });

    // Total leads
    const qLeads = query(collection(db, "leads"));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      setMetrics((prev) => ({ ...prev, totalLeads: snapshot.size }));
    });

    // Total Revenue globally
    const qEarnings = query(collection(db, "earnings"));
    const unsubscribeEarnings = onSnapshot(qEarnings, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        total += doc.data().amount || 0;
      });
      setMetrics((prev) => ({ ...prev, totalRevenue: total }));
    });

    // High level alerts / notifications
    const qNotif = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(5),
    );
    const unsubscribeNotif = onSnapshot(
      qNotif,
      (snapshot) => {
        setSystemAlerts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "notifications");
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeLeads();
      unsubscribeEarnings();
      unsubscribeNotif();
    };
  }, []);

  const markAsRead = async (
    notificationId: string,
    currentReadBy: string[],
  ) => {
    if (!user) return;
    try {
      const ref = doc(db, "notifications", notificationId);
      await updateDoc(ref, {
        readBy: [...(currentReadBy || []), user.uid],
      });
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

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
          Command Center
        </h1>
        <p className="text-slate-400 font-medium">
          Super Admin Overview. Full system visibility.
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
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-brand-green/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-brand-green uppercase tracking-wider">
              Approved Members
            </h3>
            <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.approvedMembers}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
              Approved Admins
            </h3>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Shield size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.approvedAdmins}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Total Global Leads
            </h3>
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
              <Database size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.totalLeads}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-brand-blue/20 shadow-[0_0_15px_rgba(1,33,255,0.1)] relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider">
              Global Payouts
            </h3>
            <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            ₹{metrics.totalRevenue.toLocaleString()}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        className="mt-8 grid lg:grid-cols-2 gap-8"
      >
        <div className="bg-[#0A0E1A]/80 rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Activity size={18} className="text-brand-blue" /> System Alerts
            </h2>
          </div>
          <div className="p-0 flex-1">
            {systemAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                All systems normal.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {systemAlerts.map((alert) => {
                  const isRead = alert.readBy?.includes(user?.uid) || false;
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 flex items-start gap-4 transition-colors ${isRead ? "bg-transparent" : "bg-red-500/5"}`}
                    >
                      <div
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isRead ? "bg-gray-600" : "bg-red-500 animate-pulse"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                          {alert.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                          {!isRead && (
                            <button
                              onClick={() => markAsRead(alert.id, alert.readBy)}
                              className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:text-blue-400"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0A0E1A]/80 rounded-2xl border border-white/10 shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">
            Network Architecture
          </h3>
          <div className="w-full space-y-4 max-w-sm">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-sm font-bold text-slate-300">
                Super Admins
              </div>
              <div className="font-black text-brand-yellow font-mono">
                {metrics.superAdmins}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-sm font-bold text-red-300">Total Admins</div>
              <div className="text-right">
                <span className="font-black text-white font-mono">
                  {metrics.approvedAdmins}
                </span>
                {metrics.pendingAdmins > 0 && (
                  <span className="ml-2 text-[10px] text-red-400">
                    ({metrics.pendingAdmins} pending)
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-sm font-bold text-brand-green">
                Total Members
              </div>
              <div className="text-right">
                <span className="font-black text-white font-mono">
                  {metrics.approvedMembers}
                </span>
                {metrics.pendingMembers > 0 && (
                  <span className="ml-2 text-[10px] text-slate-400">
                    ({metrics.pendingMembers} pending)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
