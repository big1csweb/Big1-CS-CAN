import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";

export function Settings() {
  const { profile } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandSettings, setBrandSettings] = useState({
    logoUrl: "",
    primaryColor: "#2563eb",
  });
  const [savingBrand, setSavingBrand] = useState(false);

  if (profile?.role !== "super_admin") {
    return <div className="p-8">Unauthorized access. Super Admins only.</div>;
  }

  useEffect(() => {
    // Fetch users
    const qAdmins = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      qAdmins,
      (snapshot) => {
        const allUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        setAdmins(
          allUsers.filter(
            (u) => u.role === "admin" || u.role === "super_admin",
          ),
        );
        setMembers(allUsers.filter((u) => u.role === "member"));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "users");
      },
    );

    // Fetch branding settings
    const unsubscribeBrand = onSnapshot(
      doc(db, "settings", "branding"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setBrandSettings({
            logoUrl: data.logoUrl || "",
            primaryColor: data.primaryColor || "#2563eb",
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "settings/branding");
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeBrand();
    };
  }, []);

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleSaveBrandSettings = async () => {
    setSavingBrand(true);
    try {
      // In a real app we'd also handle setting the doc if it doesn't exist
      // Since updateDoc fails if doc doesn't exist, we should use setDoc with merge
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "settings", "branding"),
        {
          logoUrl: brandSettings.logoUrl,
          primaryColor: brandSettings.primaryColor,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/branding");
    } finally {
      setSavingBrand(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandSettings((prev) => ({
          ...prev,
          logoUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-[0.2em]">
            Super Admin Panel
          </span>
        </div>
        <h1 className="text-3xl font-black font-brand tracking-tight text-white">
          System Settings
        </h1>
        <p className="text-slate-400 font-medium mt-1">
          Manage C.A.N. administrators and global settings.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <motion.div variants={item} className="md:col-span-2">
          <div className="bg-[#0A0E1A]/80 border border-white/10 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="bg-[#111827] p-6 border-b border-white/5 flex flex-col space-y-1.5">
              <h3 className="text-base font-black font-brand uppercase tracking-wide text-white">
                Brand Settings (ID Cards)
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Logo Upload (Max 1MB)
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer bg-[#111827] border-white/10 text-white file:text-white"
                    />
                    <p className="text-[10px] text-slate-400">
                      Or paste an image URL below:
                    </p>
                    <Input
                      type="text"
                      placeholder="https://example.com/logo.png"
                      value={brandSettings.logoUrl}
                      onChange={(e) =>
                        setBrandSettings({
                          ...brandSettings,
                          logoUrl: e.target.value,
                        })
                      }
                      className="bg-[#111827] border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Master Brand Color
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={brandSettings.primaryColor}
                        onChange={(e) =>
                          setBrandSettings({
                            ...brandSettings,
                            primaryColor: e.target.value,
                          })
                        }
                        className="w-16 h-12 p-1 cursor-pointer bg-[#111827] border-white/10 text-white"
                      />
                      <Input
                        type="text"
                        value={brandSettings.primaryColor}
                        onChange={(e) =>
                          setBrandSettings({
                            ...brandSettings,
                            primaryColor: e.target.value,
                          })
                        }
                        className="font-mono text-sm uppercase bg-[#111827] border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-[#111827]">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-4 tracking-widest">
                    Preview
                  </p>
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center p-2 mb-2"
                    style={{ backgroundColor: brandSettings.primaryColor }}
                  >
                    {brandSettings.logoUrl ? (
                      <img
                        src={brandSettings.logoUrl}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain brightness-0 invert"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <span className="text-white font-black text-xl">B1</span>
                    )}
                  </div>
                  <div
                    className="h-2 w-16 rounded-full mt-2 opacity-50"
                    style={{ backgroundColor: brandSettings.primaryColor }}
                  ></div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 p-6 -mx-6 -mb-6 bg-[#111827] border-t border-white/5">
                <Button
                  onClick={handleSaveBrandSettings}
                  disabled={savingBrand}
                  className="bg-brand-blue hover:bg-blue-800 text-white font-bold uppercase tracking-widest text-[10px]"
                >
                  {savingBrand ? "Saving..." : "Save Brand Settings"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-[#0A0E1A]/80 border border-white/10 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="bg-[#111827] p-6 border-b border-white/5 flex flex-col space-y-1.5">
              <h3 className="text-base font-black font-brand uppercase tracking-wide text-white">
                Current Administrators
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex justify-between items-center p-3 bg-[#111827] hover:bg-brand-blue/5 border border-white/10 hover:border-brand-blue/20 rounded-xl transition-colors group"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {admin.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {admin.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-800 px-2 py-1 rounded-md border border-purple-200">
                        {admin.role.replace("_", " ")}
                      </span>
                      {admin.role !== "super_admin" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden group-hover:flex text-red-500 hover:bg-red-50 hover:text-red-700 uppercase tracking-widest text-[10px] font-bold h-7"
                          onClick={() => handleChangeRole(admin.id, "member")}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-[#0A0E1A]/80 border border-white/10 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="bg-[#111827] p-6 border-b border-white/5 flex flex-col space-y-1.5">
              <h3 className="text-base font-black font-brand uppercase tracking-wide text-white">
                Promote Member to Admin
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 border border-white/10 bg-[#0A0E1A]/80 hover:bg-brand-blue/5 hover:border-brand-blue/20 transition-colors rounded-xl group"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {member.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-brand-blue hover:bg-blue-800 text-white font-bold uppercase tracking-widest text-[10px] shadow-sm shadow-brand-blue/20 opacity-0 group-hover:opacity-100 transition-opacity h-7"
                        onClick={() => handleChangeRole(member.id, "admin")}
                      >
                        Make Admin
                      </Button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm font-medium text-slate-400 text-center py-8">
                    No members to promote.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
