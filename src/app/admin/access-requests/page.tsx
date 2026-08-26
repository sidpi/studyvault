"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShieldCheck, Sparkle, XCircle } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type AccessRequest = {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  decided_at: string | null;
};

export default function AdminAccessRequestsPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [message, setMessage] = useState("");
  const [pendingActionId, setPendingActionId] = useState("");
  const { supabase } = useSupabase();
  const router = useRouter();

  const loadRequests = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const response = await fetch("/api/admin/access-requests", { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json() as { requests?: AccessRequest[]; error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Unable to load access requests.");
      return;
    }
    setRequests(Array.isArray(result.requests) ? result.requests : []);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data: userResult } = await supabase.auth.getUser();
      if (!userResult.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle();
      if (!mounted) return;
      if (profile?.role !== "super_admin") {
        setChecking(false);
        return;
      }
      setAllowed(true);
      await loadRequests();
      if (!mounted) return;
      setChecking(false);
    }
    void init();
    return () => { mounted = false; };
  }, [loadRequests, router, supabase]);

  async function decide(id: string, action: "approve" | "reject") {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    setPendingActionId(id);
    setMessage("");
    const response = await fetch(`/api/admin/access-requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    const result = await response.json() as { message?: string; error?: string };
    setMessage(response.ok ? (result.message ?? "Updated.") : (result.error ?? "Unable to update request."));
    setPendingActionId("");
    if (response.ok) await loadRequests();
  }

  if (checking) return <main className="loading-screen"><Sparkle size={20} weight="fill" /><span>Checking Super Admin access...</span></main>;
  if (!allowed) return <main className="loading-screen"><ShieldCheck size={24} /><h1>Super Admin access required.</h1><Link className="outline-button" href="/admin">Back to admin</Link></main>;

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/access-requests"><ShieldCheck size={19} weight="fill" /><span>Access requests</span></Link><Link className="side-nav-item" href="/admin/users"><span>People</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>Access requests</strong></div></header><div className="content admin-manage-content"><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">Private access</p><h1>Approve new members<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Requests stay pending until a Super Admin approves or rejects them.</p>{message && <p className="manage-message">{message}</p>}
        <section className="access-requests-list">
          {requests.length === 0 && <div className="empty-state"><ShieldCheck size={24} /><p>No access requests yet.</p></div>}
          {requests.map((request) => (
            <div className="access-request-row" key={request.id}>
              <div className="access-request-main">
                <strong>{request.email}</strong>
                <p>Requested on {new Date(request.requested_at).toLocaleString()}</p>
              </div>
              <span className={`access-request-status ${request.status}`}>{request.status}</span>
              {request.status === "pending" && (
                <div className="access-request-actions">
                  <button className="outline-button small" disabled={pendingActionId === request.id} onClick={() => void decide(request.id, "reject")}><XCircle size={16} /> Reject</button>
                  <button className="primary-button small" disabled={pendingActionId === request.id} onClick={() => void decide(request.id, "approve")}><CheckCircle size={16} /> Approve</button>
                </div>
              )}
            </div>
          ))}
        </section>
      </div></section>
    </main>
  );
}
