import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, deleteField } from "firebase/firestore";
import { motion } from "motion/react";
import { Users, Mail, Phone, Plus, Trash2, CheckCircle2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export function MyTeam() {
  const { profile, user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteTier, setInviteTier] = useState("growth_consultant");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (user && profile?.tier === "growth_partner") {
      fetchTeamData();
    }
  }, [user, profile]);

  const fetchTeamData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch actual team members
      const membersQuery = query(
        collection(db, "users"),
        where("invitedBy", "==", user.uid)
      );
      const membersSnapshot = await getDocs(membersQuery);
      const membersData = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(membersData);

      // Fetch pending invites
      const invitesQuery = query(
        collection(db, "team_invites"),
        where("partnerId", "==", user.uid)
      );
      const invitesSnapshot = await getDocs(invitesQuery);
      const invitesData = invitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvites(invitesData);

    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, "team_invites / users");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail || !invitePhone) return;
    try {
      setIsInviting(true);
      await addDoc(collection(db, "team_invites"), {
        email: inviteEmail.toLowerCase(),
        phone: invitePhone,
        tier: inviteTier,
        partnerId: user.uid,
        partnerName: profile?.name || "Growth Partner",
        createdAt: Date.now(),
      });
      setInviteEmail("");
      setInvitePhone("");
      fetchTeamData();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "team_invites");
    } finally {
      setIsInviting(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      await deleteDoc(doc(db, "team_invites", inviteId));
      fetchTeamData();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `team_invites/${inviteId}`);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from your team? They will remain an active user but will no longer be mapped under you.")) return;
    try {
      await updateDoc(doc(db, "users", memberId), {
        invitedBy: deleteField(),
        updatedAt: Date.now()
      });
      fetchTeamData();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${memberId}`);
    }
  };

  if (!profile || profile.tier !== "growth_partner") {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        This feature is only available for Growth Partners.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white font-brand tracking-tight mb-2">My Team</h1>
          <p className="text-slate-400">Manage your Growth Consultants and Principals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-[#0A0E1A]/80 border-white/5 shadow-xl backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 bg-slate-900/50">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-brand-blue" />
                Invite Team Member
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                They will be required to complete their profile upon signing up.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role</label>
                  <select
                    className="w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 outline-none"
                    value={inviteTier}
                    onChange={(e) => setInviteTier(e.target.value)}
                  >
                    <option value="growth_consultant">Growth Consultant</option>
                    <option value="growth_principal">Growth Principal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-[#111827] border-white/10 focus:border-brand-blue"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone Number</label>
                  <Input
                    required
                    type="tel"
                    placeholder="+91..."
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="bg-[#111827] border-white/10 focus:border-brand-blue"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isInviting || !inviteEmail || !invitePhone}
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold tracking-wide"
                >
                  {isInviting ? "Inviting..." : "Send Invite"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-[#0A0E1A]/80 border-white/5 shadow-xl backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 bg-slate-900/50">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-yellow" />
                Active Team Members ({teamMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : teamMembers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No active team members yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {teamMembers.map((member) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
                          {member.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            {member.name}
                            {member.status === "approved" && (
                              <CheckCircle2 size={14} className="text-brand-green" />
                            )}
                          </div>
                          <div className="text-slate-400 text-xs flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail size={12} /> {member.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {member.phone || "No phone"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-brand-blue mb-1">
                            {member.tier?.replace("_", " ")}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Status: <span className={member.status === "approved" ? "text-brand-green" : "text-amber-500"}>{member.status}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeMember(member.id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {invites.length > 0 && (
            <Card className="bg-[#0A0E1A]/80 border-white/5 shadow-xl backdrop-blur-xl">
              <CardHeader className="border-b border-white/5 bg-slate-900/50">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail size={18} className="text-slate-400" />
                  Pending Invites ({invites.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {invites.map((invite) => (
                    <motion.div 
                      key={invite.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-300 text-sm">{invite.email}</div>
                        <div className="text-slate-500 text-xs mt-1 flex items-center gap-3">
                          <span className="uppercase text-[10px] tracking-wider font-bold text-brand-blue">{invite.tier?.replace("_", " ")}</span>
                          <span>{invite.phone}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => cancelInvite(invite.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} className="mr-1" /> Cancel
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
