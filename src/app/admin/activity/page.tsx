"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ActivityIcon, ArrowLeft, CheckCircle, FilePdf, ShieldCheck, Sparkle, UserCircle } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type Log = { id: string; action: string; resource_type: string; created_at: string; metadata: Record<string, string> | null };

const actionLabels: Record<string, string> = { uploaded: "Uploaded a material", deleted: "Deleted a material", viewed: "Viewed a material", downloaded: "Downloaded a material", bookmarked: "Saved a material", unbookmarked: "Removed a bookmark", role_changed: "Changed a role" };

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void supabase.from("activity_logs").select("id, action, resource_type, created_at, metadata").order("created_at", { ascending: false }).limit(50).then((result: { data: Log[] | null; error: { message: string } | null }) => {
        if (result.error) setMessage(result.error.message);
        else if (result.data) setLogs(result.data);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/activity"><ActivityIcon size={19} weight="fill" /><span>Activity</span></Link><Link className="side-nav-item" href="/admin/users"><UserCircle size={19} /><span>People</span></Link></nav></aside><section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>Activity</strong></div></header><div className="content admin-manage-content"><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">Audit trail</p><h1>Recent activity<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">A quiet record of what changed in your shared study space.</p>{message && <p className="manage-message">{message}</p>}<section className="activity-list">{logs.length === 0 && <div className="empty-state"><ActivityIcon size={24} /><p>No activity has been recorded yet.</p></div>}{logs.map((log) => <div className="activity-row" key={log.id}><div className="activity-icon">{log.action === "role_changed" ? <ShieldCheck size={18} /> : log.action === "viewed" ? <FilePdf size={18} /> : <CheckCircle size={18} />}</div><div className="activity-copy"><strong>{actionLabels[log.action] ?? log.action}</strong><span>{log.metadata?.file_name ?? log.resource_type}</span></div><time>{new Date(log.created_at).toLocaleString()}</time></div>)}</section></div></section></main>;
}
