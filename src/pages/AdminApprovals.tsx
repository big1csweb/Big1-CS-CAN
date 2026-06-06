import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Check, X, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";

export function AdminApprovals() {
  const { profile } = useAuth();
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);
  const [invitedAdmins, setInvitedAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [invitingAdmin, setInvitingAdmin] = useState(false);

  if (profile?.role !== "super_admin") {
    return <div className="p-8">Unauthorized access. Super Admins only.</div>;
  }

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      q,
      (snapshot) => {
        const all: any[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingAdmins(
          all
            .filter((u) => u.status === "pending" && u.role === "admin")
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "users");
      },
    );

    const qInvites = query(collection(db, "admin_invites"));
    const unsubscribeInvites = onSnapshot(
      qInvites,
      (snapshot) => {
        const all: any[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvitedAdmins(all.sort((a, b) => b.invitedAt - a.invitedAt));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "admin_invites");
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeInvites();
    };
  }, []);

  const handleAction = async (
    userId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        status: status,
        updatedAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail) return;
    setInvitingAdmin(true);
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "admin_invites", inviteEmail.toLowerCase()), {
        email: inviteEmail.toLowerCase(),
        phone: invitePhone,
        role: "admin",
        invitedAt: Date.now(),
      });
      alert(
        `Successfully invited ${inviteEmail} as an admin. They can now join and will be auto-approved after filling their profile.`,
      );
      setInviteEmail("");
      setInvitePhone("");
    } catch (err) {
      console.error(err);
      alert("Failed to invite admin.");
    } finally {
      setInvitingAdmin(false);
    }
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-[0.2em]">
            Super Admin Panel
          </span>
        </div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">
          Admin Approvals
        </h1>
        <p className="text-slate-400 mt-1 font-medium">
          Review and approve new Administrators joining the network.
        </p>
      </div>

      <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden mb-8">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
          </div>
        ) : pendingAdmins.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <div className="w-20 h-20 bg-[#111827] flex items-center justify-center rounded-full mb-6 border border-white/10 shadow-inner">
              <ShieldCheck className="text-gray-300" size={36} />
            </div>
            <p className="font-black text-xl text-white mb-2 font-brand tracking-wide">
              All caught up!
            </p>
            <p className="text-slate-400 font-medium max-w-sm">
              No pending admin approvals at the moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 bg-[#111827] uppercase tracking-widest font-bold border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Verification Docs</th>
                  <th className="px-6 py-4">Why Join</th>
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
                {pendingAdmins.map((u) => (
                  <motion.tr
                    variants={item}
                    key={`admin-${u.id}`}
                    className="hover:bg-red-500/5 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-slate-400 font-medium text-xs mt-0.5">
                        {u.email}
                      </div>
                      {u.phone && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
                          {u.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {u.documentUrl ? (
                        <a
                          href={u.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-brand-blue hover:text-blue-800 font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap bg-brand-blue/5 px-3 py-1.5 rounded-md border border-brand-blue/20 hover:border-brand-blue"
                        >
                          <span className="mr-2 opacity-70">📄</span> View Docs
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-xs font-medium">
                          Not provided
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-slate-300 text-xs max-w-xs truncate">
                      {u.whyJoin || "Not provided"}
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-medium text-xs">
                      {format(u.createdAt, "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 bg-[#0A0E1A]/80 shadow-sm font-bold uppercase tracking-wider text-[10px]"
                          onClick={() => handleAction(u.id, "rejected")}
                        >
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-brand-green hover:bg-green-700 text-white shadow-sm shadow-brand-green/20 font-bold uppercase tracking-wider text-[10px]"
                          onClick={() => handleAction(u.id, "approved")}
                        >
                          <Check size={14} className="mr-1" /> Approve Admin
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

      <motion.div variants={item} className="mb-8">
        <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
          <div className="bg-[#111827] border-b border-white/5 p-6">
            <h2 className="text-base font-black font-brand uppercase tracking-wide text-white">
              Pre-Approve New Admin
            </h2>
          </div>
          <div className="p-6 border-b border-white/10">
            <div className="space-y-4 max-w-xl">
              <p className="text-[11px] text-slate-400">
                Invite a new administrator by their Google Email ID and Phone.
                When they join and complete their profile, they will bypass the
                waitlist and be instantly approved as an Admin.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <input
                  placeholder="admin@example.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                />
                <input
                  placeholder="Phone number"
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-[#111827] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                />
              </div>
              <div>
                <Button
                  onClick={handleInviteAdmin}
                  disabled={!inviteEmail || invitingAdmin}
                  className="bg-brand-blue hover:bg-blue-800 text-white font-bold uppercase tracking-widest text-[10px]"
                >
                  {invitingAdmin ? "Inviting..." : "Send Invite"}
                </Button>
              </div>
            </div>
          </div>

          {invitedAdmins.length > 0 && (
            <div className="bg-[#0A0E1A]/80">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Invited Admins
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-400 bg-[#111827]/50 uppercase tracking-widest font-bold border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Invited On</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {invitedAdmins.map((invite) => (
                      <tr
                        key={`invite-${invite.id}`}
                        className="hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-3 font-medium text-white">
                          {invite.email}
                        </td>
                        <td className="px-6 py-3 text-slate-400">
                          {invite.phone || "—"}
                        </td>
                        <td className="px-6 py-3 text-slate-400 text-xs">
                          {invite.invitedAt
                            ? format(invite.invitedAt, "MMM d, yyyy")
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-brand-blue/10 text-brand-blue rounded border border-brand-blue/20">
                            Pending Signup
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
