import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Navigate, useNavigate } from "react-router-dom";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { motion } from "motion/react";
import {
  Clock,
  Download,
  FileText,
  Check,
  Briefcase,
  GraduationCap,
  Building2,
  Laptop,
  MoreHorizontal,
} from "lucide-react";

const COE_OPTIONS = [
  "Setup",
  "Compliance",
  "Wealth",
  "Assurance",
  "Advisory",
  "Diligence",
];

const PRO_STATUS_OPTIONS = [
  {
    value: "job",
    label: "Employed",
    description: "Working under an employer",
    icon: Briefcase,
  },
  {
    value: "profession",
    label: "Professional",
    description: "CA, Lawyer, Architect, etc.",
    icon: GraduationCap,
  },
  {
    value: "business",
    label: "Business",
    description: "Owner or Entrepreneur",
    icon: Building2,
  },
  {
    value: "freelancer",
    label: "Freelancer",
    description: "Independent Consultant",
    icon: Laptop,
  },
  {
    value: "other",
    label: "Other",
    description: "Other specified status",
    icon: MoreHorizontal,
  },
];

export function Onboarding() {
  const { user, profile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    canIdPrefix: profile?.canIdPrefix || (profile?.name ? profile.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : ""),
    tier: profile?.tier || "growth_consultant",
    documentUrl: profile?.documentUrl || "",
    selectedCoes: profile?.selectedCoes || ([] as string[]),
    professionalStatus: profile?.professionalStatus || "",
    professionalDetails: profile?.professionalDetails || ({} as any),
    experienceMonths: profile?.experienceMonths || "",
    whyJoin: profile?.whyJoin || "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (authLoading) {
    return <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4 text-white font-bold uppercase tracking-widest text-sm">Loading Application...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  const isProfileComplete =
    profile?.name &&
    profile?.phone &&
    profile?.tier &&
    profile?.selectedCoes?.length > 0 &&
    profile?.professionalStatus;

  // If approved/rejected and profile is complete, go back to dash
  if (profile && profile.role === "super_admin")
    return <Navigate to="/" replace />;
  if (profile && profile.status !== "pending" && profile.status !== "rejected" && profile.phone && profile.tier)
    return <Navigate to="/" replace />;
  const hasUnansweredQueries = profile?.adminQueries?.some(
    (q: any) => !q.answered,
  );

  if (isProfileComplete && profile.status === "pending") {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <Card className="w-full text-center shadow-lg border-0 bg-[#111827]/80 backdrop-blur-sm rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-bl-full -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/10 rounded-tr-[100px] -z-10" />
            <CardHeader className="pt-10">
              <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-2 border-2 border-brand-blue/20 rounded-full animate-spin-slow"></div>
                <Clock size={32} className="text-brand-blue" />
              </div>
              <CardTitle className="text-3xl font-black font-brand tracking-tight text-white">
                Under Review
              </CardTitle>
              <p className="text-[15px] font-medium text-slate-400 mt-4 leading-relaxed mx-auto px-4">
                Your application and documents have been received and are
                currently being reviewed by an administrator.
                <br />
                <br />
                <span className="text-brand-blue font-bold">
                  You will be notified once your account is approved.
                </span>
              </p>

              {profile?.adminQueries?.length > 0 && (
                <div className="mt-8 text-left bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl p-6 text-sm">
                  <h3 className="font-bold text-white mb-4 border-b border-white/10 pb-2">
                    Queries from Admin
                  </h3>
                  <div className="space-y-4">
                    {profile.adminQueries.map((q: any, i: number) => (
                      <div key={q.id}>
                        <p className="font-medium text-slate-300">
                          {i + 1}. {q.message}
                        </p>
                        {q.answered ? (
                          <p className="mt-1 text-slate-400 bg-[#111827] p-2 rounded border border-white/10 italic text-xs flex justify-between items-center">
                            {q.queryType === "document" ? (
                              <a
                                href={q.answer}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-blue hover:underline font-bold"
                              >
                                📄 View Uploaded Document
                              </a>
                            ) : (
                              `Your answer: ${q.answer}`
                            )}
                          </p>
                        ) : q.queryType === "document" ? (
                          <div className="mt-2 flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-300">
                              Upload Document ({q.message})
                            </label>
                            <Input
                              id={`query-${q.id}`}
                              type="file"
                              accept=".pdf,image/*"
                              className="h-10 text-xs w-full pt-2"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !user) return;
                                try {
                                  setUploading(true);
                                  const { ref, uploadBytes, getDownloadURL } =
                                    await import("firebase/storage");
                                  const { storage } =
                                    await import("../lib/firebase");
                                  const fileRef = ref(
                                    storage,
                                    `documents/${user.uid}/${Date.now()}_${file.name}`,
                                  );
                                  await uploadBytes(fileRef, file);
                                  const url = await getDownloadURL(fileRef);
                                  const newQueries = profile.adminQueries.map(
                                    (query: any) =>
                                      query.id === q.id
                                        ? {
                                            ...query,
                                            answered: true,
                                            answer: url,
                                          }
                                        : query,
                                  );
                                  await updateDoc(doc(db, "users", user.uid), {
                                    adminQueries: newQueries,
                                    updatedAt: Date.now(),
                                  });
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <Input
                              id={`query-${q.id}`}
                              placeholder="Type your answer..."
                              className="h-9 text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                const input = document.getElementById(
                                  `query-${q.id}`,
                                ) as HTMLInputElement;
                                if (!input.value.trim()) return;
                                const newQueries = profile.adminQueries.map(
                                  (query: any) =>
                                    query.id === q.id
                                      ? {
                                          ...query,
                                          answered: true,
                                          answer: input.value,
                                        }
                                      : query,
                                );
                                try {
                                  await updateDoc(doc(db, "users", user.uid), {
                                    adminQueries: newQueries,
                                    updatedAt: Date.now(),
                                  });
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            >
                              Submit
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardFooter className="justify-center pb-8 border-t border-white/10/80 mt-6 pt-6 bg-[#111827]/50">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white font-bold uppercase tracking-widest text-[10px]"
                onClick={() => logout()}
                type="button"
              >
                Logout & Return Later
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  const toggleCoe = (coe: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCoes: prev.selectedCoes.includes(coe)
        ? prev.selectedCoes.filter((c) => c !== coe)
        : [...prev.selectedCoes, coe],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!user) return;
    if (formData.selectedCoes.length === 0) {
      setErrorMsg("Please select at least one Centre of Excellence (COE).");
      return;
    }
    // Document validation removed to allow onboarding without Firebase Storage
    // if (!formData.documentUrl && !profile?.documentUrl) {
    //   setErrorMsg("Please wait for the document to finish uploading, or select a document.");
    //   return;
    // }
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      const getTierSuffix = (tier: string) => {
         switch (tier) {
           case 'growth_consultant': return 'gc';
           case 'growth_principal': return 'gpl';
           case 'growth_partner': return 'gp';
           default: return 'na';
         }
       };

      const computedCanId = `${formData.canIdPrefix}.${getTierSuffix(formData.tier)}.can@big1cs`.toLowerCase();

      const updatePayload = {
        name: formData.name,
        phone: formData.phone,
        canIdPrefix: formData.canIdPrefix,
        canId: computedCanId,
        tier: formData.tier,
        selectedCoes: formData.selectedCoes,
        professionalStatus: formData.professionalStatus,
        professionalDetails: formData.professionalDetails,
        experienceMonths: formData.experienceMonths,
        whyJoin: formData.whyJoin,
        documentUrl: formData.documentUrl,
        updatedAt: Date.now(),
      };
      if (profile) {
        await updateDoc(userRef, {
          ...updatePayload,
          ...(profile.status === 'rejected' ? { status: 'pending', rejectionRemarks: null } : {})
        });
      } else {
        await setDoc(userRef, {
          ...updatePayload,
          role: "member",
          status: "pending",
          email: user.email,
          createdAt: Date.now(),
        });
      }
      // Force reload to get updated profile state
      window.location.href = "/";
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || "An error occurred while saving your profile.");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 7;
    if (formData.name.trim()) completed++;
    if (formData.phone.trim()) completed++;
    if (formData.selectedCoes.length > 0) completed++;
    if (formData.professionalStatus) completed++;
    if (formData.experienceMonths) completed++;
    if (formData.whyJoin.trim()) completed++;
    if (formData.documentUrl) completed++;
    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
    };
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen relative bg-[#050814] flex flex-col font-sans overflow-y-auto">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none fixed"></div>
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none fixed"></div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl my-12"
        >
          <Card className="w-full border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative bg-[#0A0E1A]/80 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 pb-8 pt-8 px-8 lg:px-12">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-purple-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-[0_0_20px_rgba(1,33,255,0.4)]">
                <FileText size={24} />
              </div>
              <CardTitle className="text-3xl font-black font-brand tracking-tight text-white">
                {profile?.status === 'rejected' ? 'Update Application' : 'Complete Application'}
              </CardTitle>
              {profile?.status === 'rejected' && profile?.rejectionRemarks && (
                 <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-left shadow-inner">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-red-400 block mb-1">Previous Rejection Remarks:</span>
                    {profile.rejectionRemarks}
                 </div>
              )}
              <p className="text-[13px] font-medium text-slate-400 mt-2 leading-relaxed">
                Please complete your profile details and provide verification
                documents to join the Big1CS C.A.N. Portal.
              </p>

              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Application Progress
                  </span>
                  <span className="text-sm font-black text-brand-blue">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-[#111827] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-blue to-purple-600 rounded-full shadow-[0_0_10px_rgba(1,33,255,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-2 text-right">
                  {progress.completed} of {progress.total} sections completed
                </p>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Full Name
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Phone Number
                    </label>
                    <Input
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 234 567 8900"
                      className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Choose your C.A.N. ID (User ID)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        required
                        value={formData.canIdPrefix}
                        onChange={(e) =>
                          setFormData({ ...formData, canIdPrefix: e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '') })
                        }
                        placeholder="firstname"
                        className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue tracking-widest text-white flex-1"
                      />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-[#111827] h-11 px-3 sm:px-4 rounded-md border border-white/10 flex items-center select-none shrink-0 tracking-wider">
                        .tier.can@big1cs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Centre of Excellence (Select at least 1)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COE_OPTIONS.map((coe) => (
                      <div
                        key={coe}
                        onClick={() => toggleCoe(coe)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.selectedCoes.includes(coe) ? "bg-brand-blue/5 border-brand-blue text-brand-blue" : "bg-[#111827] border-white/10 text-slate-300 hover:border-brand-blue/50"}`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${formData.selectedCoes.includes(coe) ? "bg-brand-blue border-brand-blue" : "border-white/10"}`}
                        >
                          {formData.selectedCoes.includes(coe) && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        <span className="text-xs font-semibold">{coe}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Current Professional Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRO_STATUS_OPTIONS.map((status) => {
                      const Icon = status.icon;
                      const isSelected =
                        formData.professionalStatus === status.value;
                      return (
                        <div
                          key={status.value}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              professionalStatus: status.value,
                              professionalDetails: {},
                            })
                          }
                          className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? "bg-brand-blue/5 border-brand-blue shadow-sm" : "bg-[#111827] border-white/10 hover:border-brand-blue/30 hover:bg-[#111827]"}`}
                        >
                          <div
                            className={`p-2.5 rounded-lg border flex items-center justify-center ${isSelected ? "bg-brand-blue border-brand-blue text-white" : "bg-[#111827] border-white/10 text-slate-400"}`}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <h4
                              className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-300"}`}
                            >
                              {status.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                              {status.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: formData.professionalStatus ? "auto" : 0,
                    opacity: formData.professionalStatus ? 1 : 0,
                  }}
                  className="overflow-hidden"
                >
                  {formData.professionalStatus === "job" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Current Employer / Company
                        </label>
                        <Input
                          required
                          value={formData.professionalDetails.employer || ""}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                employer: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Designation
                        </label>
                        <Input
                          required
                          value={formData.professionalDetails.designation || ""}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                designation: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Years of Experience
                        </label>
                        <Input
                          required
                          type="number"
                          value={formData.professionalDetails.experience || ""}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                experience: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                    </div>
                  )}

                  {formData.professionalStatus === "profession" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Profession Type
                        </label>
                        <Input
                          required
                          placeholder="e.g. CA, Lawyer, Architect"
                          value={
                            formData.professionalDetails.professionType || ""
                          }
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                professionType: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Years of Practice
                        </label>
                        <Input
                          required
                          type="number"
                          value={
                            formData.professionalDetails.practiceYears || ""
                          }
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                practiceYears: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                    </div>
                  )}

                  {formData.professionalStatus === "business" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Business Name (Optional)
                        </label>
                        <Input
                          value={
                            formData.professionalDetails.businessName || ""
                          }
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                businessName: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Industry
                        </label>
                        <Input
                          required
                          value={formData.professionalDetails.industry || ""}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                industry: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Annual Turnover (Estimate)
                        </label>
                        <Input
                          required
                          value={formData.professionalDetails.turnover || ""}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                turnover: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                    </div>
                  )}

                  {formData.professionalStatus === "freelancer" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111827] border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Primary Skill/Service
                        </label>
                        <Input
                          required
                          value={
                            formData.professionalDetails.primarySkill || ""
                          }
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                primarySkill: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Years of Freelancing
                        </label>
                        <Input
                          required
                          type="number"
                          value={
                            formData.professionalDetails.freelancingYears || ""
                          }
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                freelancingYears: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                    </div>
                  )}

                  {formData.professionalStatus === "other" && (
                    <div className="p-4 rounded-xl bg-[#111827] border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Please Specify Details
                        </label>
                        <Input
                          required
                          value={
                            formData.professionalDetails.otherDetails || ""
                          }
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              professionalDetails: {
                                ...p.professionalDetails,
                                otherDetails: e.target.value,
                              },
                            }))
                          }
                          className="h-10 text-sm bg-[#111827]"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Experience in related field (in months)
                  </label>
                  <Input
                    required
                    type="number"
                    value={formData.experienceMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceMonths: e.target.value,
                      })
                    }
                    placeholder="e.g. 24"
                    className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue font-medium"
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Why do you want to be part of this?
                  </label>
                  <textarea
                    required
                    value={formData.whyJoin}
                    onChange={(e) =>
                      setFormData({ ...formData, whyJoin: e.target.value })
                    }
                    placeholder="Tell us about your motivation..."
                    className="flex w-full rounded-md border border-white/10 bg-[#111827]/50 px-3 py-3 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all min-h-[100px] resize-y"
                  />
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Member Tier
                  </label>
                  <select
                    className="flex h-11 w-full rounded-md border border-white/10 bg-[#111827]/50 px-3 py-2 text-[13px] font-medium text-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.tier}
                    disabled={!!profile?.invitedBy}
                    onChange={(e) =>
                      setFormData({ ...formData, tier: e.target.value })
                    }
                  >
                    <option value="growth_consultant">
                      Growth Consultant (Students & Freelancers)
                    </option>
                    <option value="growth_principal">
                      Growth Principal (Team Leaders & Experienced)
                    </option>
                    <option value="growth_partner">
                      Growth Partner (Firms & Agencies)
                    </option>
                  </select>
                </div>

                <div className="space-y-3 pt-6 pb-2 border-t border-white/10/80 mt-6">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">
                      Document Verification Upload
                    </label>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed bg-brand-blue/5 p-3 rounded-md border border-brand-blue/10">
                    Upload a document (Image or PDF) containing your identity
                    proof and qualifications for Admins to verify. Max size:
                    5MB.
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setErrorMsg("File is too large (max 5MB).");
                        e.target.value = "";
                        return;
                      }
                      setUploading(true);
                      setErrorMsg(null);
                      try {
                        const { ref, uploadBytes, getDownloadURL } =
                          await import("firebase/storage");
                        const { storage } = await import("../lib/firebase");
                        const fileRef = ref(
                          storage,
                          `documents/${user.uid}/${Date.now()}_${file.name}`,
                        );
                        await uploadBytes(fileRef, file);
                        const url = await getDownloadURL(fileRef);
                        setFormData({ ...formData, documentUrl: url });
                      } catch (err: any) {
                        console.error(err);
                        setErrorMsg(
                          "Failed to upload document. Please check permissions or try again. Error: " + (err?.message || "Unknown error")
                        );
                        e.target.value = "";
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="h-11 bg-[#111827]/50 border-white/10 focus:ring-brand-blue/20 focus:border-brand-blue mt-2 pt-2 file:text-xs file:font-medium file:text-brand-blue file:bg-brand-blue/10 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 hover:file:bg-brand-blue/20"
                  />
                  {formData.documentUrl && (
                    <p className="text-[10px] font-bold text-brand-green uppercase tracking-wider mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-green"></span>{" "}
                      Document uploaded successfully.
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3 bg-[#111827]/50 border-t border-white/10/80 pt-6 px-6 pb-8">
                {errorMsg && (
                  <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-medium">
                    {errorMsg}
                  </div>
                )}
                <Button
                  className="w-full h-12 bg-brand-blue hover:bg-blue-800 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-brand-blue/20 transition-all"
                  type="submit"
                  disabled={loading || uploading}
                >
                  {loading
                    ? "Submitting Application..."
                    : uploading
                    ? "Uploading Document..."
                    : "Submit Profile for Verification"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => logout()}
                  type="button"
                >
                  Logout / Cancel
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
