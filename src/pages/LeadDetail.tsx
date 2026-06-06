import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { ArrowLeft, MessageSquare, FileText, Send } from "lucide-react";
import { Input } from "../components/ui/input";
import { format } from "date-fns";

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [lead, setLead] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newNote, setNewNote] = useState("");
  const [newDocReq, setNewDocReq] = useState("");

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  useEffect(() => {
    if (!id) return;

    // Fetch Lead
    const leadRef = doc(db, "leads", id);
    const unsubLead = onSnapshot(
      leadRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setLead({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate("/leads");
        }
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `leads/${id}`),
    );

    // Fetch FollowUps
    const fuRef = collection(db, `leads/${id}/follow_ups`);
    const qFu = query(fuRef, orderBy("createdAt", "desc"));
    const unsubFu = onSnapshot(
      qFu,
      (snapshot) => {
        setFollowUps(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `leads/${id}/follow_ups`,
        ),
    );

    // Fetch Doc Requests
    const drRef = collection(db, `leads/${id}/document_requests`);
    const qDr = query(drRef, orderBy("updatedAt", "desc"));
    const unsubDr = onSnapshot(
      qDr,
      (snapshot) => {
        setDocRequests(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `leads/${id}/document_requests`,
        ),
    );

    return () => {
      unsubLead();
      unsubFu();
      unsubDr();
    };
  }, [id, navigate]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      const leadRef = doc(db, "leads", id);
      await updateDoc(leadRef, {
        status: newStatus,
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const handleUpdateAction = async (newAction: string) => {
    if (!id) return;

    if (newAction === "follow_up" && !isScheduling) {
      setIsScheduling(true);
      return;
    }

    try {
      const leadRef = doc(db, "leads", id);
      const updateData: any = {
        action: newAction,
        updatedAt: Date.now(),
      };

      if (newAction === "follow_up") {
        updateData.followUpDate = scheduleDate;
        updateData.followUpTime = scheduleTime;
        setIsScheduling(false);
        setScheduleDate("");
        setScheduleTime("");
      }

      await updateDoc(leadRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    try {
      const now = Date.now();
      await addDoc(collection(db, `leads/${id}/follow_ups`), {
        notes: newNote,
        date: now,
        createdAt: now,
      });
      setNewNote("");
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `leads/${id}/follow_ups`,
      );
    }
  };

  const handleAddDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocReq.trim() || !id) return;
    try {
      const now = Date.now();
      await addDoc(collection(db, `leads/${id}/document_requests`), {
        title: newDocReq,
        status: "requested",
        url: null,
        requestedAt: now,
        updatedAt: now,
      });
      setNewDocReq("");
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `leads/${id}/document_requests`,
      );
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!lead) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lead.clientName}
          </h1>
          <p className="text-slate-400 capitalize">
            {lead.coe} • {lead.status.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400 font-medium">Email</div>
                <div>{lead.clientEmail || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 font-medium">Phone</div>
                <div>{lead.clientPhone || "N/A"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-slate-400 font-medium">
                  Initial Notes
                </div>
                <div className="whitespace-pre-wrap mt-1 text-sm bg-[#111827] p-3 rounded-md">
                  {lead.notes || "No notes provided."}
                </div>
              </div>
              {lead.action === "follow_up" && (
                <div className="col-span-2 bg-brand-yellow/10 border border-brand-yellow/20 p-3 rounded-md">
                  <div className="text-sm font-bold text-brand-yellow">
                    Follow Up Scheduled
                  </div>
                  <div className="text-sm text-brand-yellow mt-1">
                    {lead.followUpDate && lead.followUpTime
                      ? `${format(new Date(`${lead.followUpDate}T${lead.followUpTime}`), "PPP p")}`
                      : lead.followUpDate ||
                        lead.followUpTime ||
                        "Time not specified"}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-[#111827] border-t flex flex-col gap-4">
              {!isScheduling ? (
                <>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="w-full text-sm font-medium">
                      Update Stage (Status)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["prospect", "confirmed"].map((status) => (
                        <Button
                          key={status}
                          variant={
                            lead.status === status ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleUpdateStatus(status)}
                          className={`capitalize ${lead.status === status ? "bg-brand-blue text-white hover:bg-brand-blue/90" : "bg-transparent border-white/20 text-slate-300 hover:text-white hover:bg-white/5"}`}
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <div className="w-full text-sm font-medium">
                      Update Action
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "not_contacted",
                        "contacted",
                        "follow_up",
                        "closed",
                      ].map((action) => (
                        <Button
                          key={action}
                          variant={
                            lead.action === action ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleUpdateAction(action)}
                          className={`capitalize ${lead.action === action ? "bg-brand-blue text-white hover:bg-brand-blue/90" : "bg-transparent border-white/20 text-slate-300 hover:text-white hover:bg-white/5"}`}
                        >
                          {action.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {[
                    "new",
                    "document_collection",
                    "processing",
                    "completed",
                    "lost",
                  ].includes(lead.status) && (
                    <div className="w-full mt-2 text-xs text-slate-400">
                      Legacy Status:{" "}
                      <span className="capitalize">
                        {lead.status.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full space-y-3">
                  <div className="text-sm font-medium">Schedule Follow Up</div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateAction("follow_up")}
                      disabled={!scheduleDate || !scheduleTime}
                      className="bg-brand-blue text-white hover:bg-brand-blue/90"
                    >
                      Save Follow Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsScheduling(false)}
                      className="bg-transparent border-white/20 text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} /> Follow Ups & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddFollowUp} className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new note or interaction..."
                />
                <Button type="submit">
                  <Send size={16} />
                </Button>
              </form>
              <div className="space-y-4 mt-6">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="pe-4 border-l-2 border-blue-500 pl-4 py-1"
                  >
                    <p className="text-sm text-white">{fu.notes}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(fu.createdAt, "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                ))}
                {followUps.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No follow-ups recorded yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} /> Document Requests
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Request required docs through the portal.
              </p>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <form
                  onSubmit={handleAddDocRequest}
                  className="flex flex-col gap-2 mb-6"
                >
                  <Input
                    value={newDocReq}
                    onChange={(e) => setNewDocReq(e.target.value)}
                    placeholder="e.g. Identity Proof, PAN Card"
                    className="text-sm"
                  />
                  <Button type="submit" size="sm" className="w-full">
                    Request Document
                  </Button>
                </form>
              )}
              <div className="space-y-3">
                {docRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-[#111827] rounded-lg border border-white/10 text-sm"
                  >
                    <div className="font-medium text-white mb-1">
                      {req.title}
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          req.status === "requested"
                            ? "bg-yellow-100 text-yellow-800"
                            : req.status === "uploaded"
                              ? "bg-blue-100 text-blue-800"
                              : req.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.url && (
                        <a
                          href={req.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View Doc
                        </a>
                      )}
                    </div>
                    {/* Note: Member upload functionality would go here but Storage rules need configuration, for now keeping it structural */}
                  </div>
                ))}
                {docRequests.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No documents requested.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
