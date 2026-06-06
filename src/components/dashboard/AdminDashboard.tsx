import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { motion } from "motion/react";
import {
  Users,
  Briefcase,
  Bell,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";

export function AdminDashboard() {
  const { profile, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    activeLeads: 0,
    pendingUsers: 0,
  });

  useEffect(() => {
    // Notifications
    const qNotif = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsubscribeNotif = onSnapshot(
      qNotif,
      (snapshot) => {
        setNotifications(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "notifications");
      },
    );

    // Active leads
    const qLeads = query(
      collection(db, "leads"),
      where("status", "not-in", ["completed", "lost"]),
    );
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      setMetrics((prev) => ({ ...prev, activeLeads: snapshot.size }));
    });

    // Pending users
    const qUsers = query(
      collection(db, "users"),
      where("status", "==", "pending"),
    );
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setMetrics((prev) => ({ ...prev, pendingUsers: snapshot.size }));
    });

    return () => {
      unsubscribeNotif();
      unsubscribeLeads();
      unsubscribeUsers();
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
          Admin Hub
        </h1>
        <p className="text-slate-400 font-medium">
          Hello {profile?.name}. Manage leads and member approvals here.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-yellow/10 rounded-full" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Active Leads
            </h3>
            <div className="p-2 bg-brand-yellow/20 text-yellow-600 rounded-lg">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.activeLeads}
          </div>
          <div className="mt-2 text-xs font-semibold text-gray-400 relative z-10">
            Across all members
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-[#0A0E1A]/80 p-6 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </h3>
            <div className="p-2 bg-red-500/20 text-red-500 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">
            {metrics.pendingUsers}
          </div>
          <div className="mt-2 text-xs font-semibold text-gray-400 relative z-10">
            Users waiting to join
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={item}
        initial="hidden"
        animate="show"
        className="mt-8"
      >
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 mb-4">
          <Bell size={20} className="text-brand-blue" /> Recent Activity
        </h2>
        <div className="bg-[#0A0E1A]/80 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              No recent notifications.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notif) => {
                const isRead = notif.readBy?.includes(user?.uid) || false;
                return (
                  <div
                    key={notif.id}
                    className={`p-4 flex items-start gap-4 transition-colors ${isRead ? "bg-[#0A0E1A]/80" : "bg-brand-blue/5"}`}
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isRead ? "bg-gray-600" : "bg-brand-blue"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => markAsRead(notif.id, notif.readBy)}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:text-blue-400 flex items-center gap-1 bg-brand-blue/10 px-2 py-1 rounded"
                      >
                        <CheckCircle2 size={12} /> Mark Read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
