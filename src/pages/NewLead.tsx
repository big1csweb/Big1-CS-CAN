import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { collection, doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export function NewLead() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    coe: "setup",
    status: "prospect",
    action: "not_contacted",
    followUpDate: "",
    followUpTime: "",
    notes: "",
  });
  const [projects, setProjects] = useState([{ title: "", description: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const leadRef = doc(collection(db, "leads"));
      const now = Date.now();
      await setDoc(leadRef, {
        memberId: user.uid,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        coe: formData.coe,
        status: formData.status,
        action: formData.action,
        followUpDate:
          formData.action === "follow_up" ? formData.followUpDate : null,
        followUpTime:
          formData.action === "follow_up" ? formData.followUpTime : null,
        projects: projects.filter((p) => p.title.trim() !== ""),
        notes: formData.notes,
        createdAt: now,
        updatedAt: now,
      });
      navigate("/leads");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "leads");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lodge New Lead</h1>
        <p className="text-slate-400">
          Enter client information to start a new engagement pipeline.
        </p>
      </div>

      <div className="bg-[#0A0E1A]/80 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="bg-[#111827] border-b border-white/5 p-6">
            <h2 className="text-base font-black font-brand uppercase tracking-wide text-white">
              Client Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Name</label>
              <Input
                required
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                className="bg-[#111827] border-white/10 text-white focus-visible:ring-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Client Email (Optional)
                </label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEmail: e.target.value })
                  }
                  className="bg-[#111827] border-white/10 text-white focus-visible:ring-brand-blue"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Client Phone (Optional)
                </label>
                <Input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, clientPhone: e.target.value })
                  }
                  className="bg-[#111827] border-white/10 text-white focus-visible:ring-brand-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Centre of Excellence (COE)
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-[#111827] text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
                  value={formData.coe}
                  onChange={(e) =>
                    setFormData({ ...formData, coe: e.target.value })
                  }
                >
                  <option value="setup">Setup</option>
                  <option value="compliance">Compliance</option>
                  <option value="assurance">Assurance</option>
                  <option value="wealth">Wealth</option>
                  <option value="advisory">Advisory</option>
                  <option value="diligence">Diligence</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Lead Stage (Status)
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-[#111827] text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="prospect">Prospect</option>
                  <option value="confirmed">Confirmed Lead</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Action</label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-[#111827] text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({ ...formData, action: e.target.value })
                  }
                >
                  <option value="not_contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="closed">Call Closed</option>
                </select>
              </div>
            </div>

            {formData.action === "follow_up" && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-brand-green/20 bg-brand-green/5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-green">
                    Follow Up Date
                  </label>
                  <Input
                    type="date"
                    required={formData.action === "follow_up"}
                    value={formData.followUpDate}
                    onChange={(e) =>
                      setFormData({ ...formData, followUpDate: e.target.value })
                    }
                    className="bg-[#111827] border-brand-green/20 text-white focus-visible:ring-brand-green"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-green">
                    Follow Up Time
                  </label>
                  <Input
                    type="time"
                    required={formData.action === "follow_up"}
                    value={formData.followUpTime}
                    onChange={(e) =>
                      setFormData({ ...formData, followUpTime: e.target.value })
                    }
                    className="bg-[#111827] border-brand-green/20 text-white focus-visible:ring-brand-green"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Projects / Services Required
                </label>
                <p className="text-[11px] text-slate-400">
                  Each service will be treated as a single project. Projects
                  must belong to the selected COE only.
                </p>
              </div>
              <div className="space-y-3">
                {projects.map((project, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 p-3 rounded-lg border border-white/5 bg-[#111827]"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Project / Service Title"
                          value={project.title}
                          onChange={(e) => {
                            const newProjects = [...projects];
                            newProjects[index].title = e.target.value;
                            setProjects(newProjects);
                          }}
                          className="bg-[#0A0E1A]/80 border-white/10"
                        />
                        <textarea
                          placeholder="Project Description..."
                          value={project.description}
                          onChange={(e) => {
                            const newProjects = [...projects];
                            newProjects[index].description = e.target.value;
                            setProjects(newProjects);
                          }}
                          className="flex min-h-[60px] w-full rounded-md border border-white/10 bg-[#0A0E1A]/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newProjects = projects.filter(
                              (_, i) => i !== index,
                            );
                            setProjects(newProjects);
                          }}
                          className="mt-2 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setProjects([...projects, { title: "", description: "" }])
                }
                className="text-xs w-full py-5 border-dashed border-white/20 bg-transparent text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Plus size={14} className="mr-1 -ml-1" /> Add Another Project
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-white/5 bg-[#111827] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add context about the client's needs..."
              />
            </div>
          </div>
          <div className="bg-[#111827] border-t border-white/5 p-6 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/leads")}
              className="border-white/10 bg-transparent text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="font-bold uppercase tracking-widest text-[10px] bg-brand-blue hover:bg-brand-blue/90 text-white"
            >
              {loading ? "Lodging..." : "Lodge Lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
