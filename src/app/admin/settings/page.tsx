"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, GearSix, LockKey, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

type Status = { supabase: boolean; r2: boolean };

export default function AdminSettingsPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function load() {
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
      const session = await supabase.auth.getSession();
      const response = await fetch("/api/admin/status", { headers: { Authorization: `Bearer ${session.data.session?.access_token ?? ""}` } });
      if (response.ok) setStatus(await response.json() as Status);
      else setMessage("Unable to read service status.");
      setChecking(false);
    }
    void load();
    return () => { mounted = false; };
  }, [router, supabase]);

  if (checking) return <main className="loading-screen"><Sparkle size={20} weight="fill" /><span>Checking Super Admin access...</span></main>;
  if (!allowed) return <main className="loading-screen"><ShieldCheck size={24} /><h1>Super Admin access required.</h1><Link className="outline-button" href="/admin">Back to admin</Link></main>;

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><ShieldCheck size={19} /><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/settings"><GearSix size={19} weight="fill" /><span>Settings</span></Link><Link className="side-nav-item" href="/"><ArrowLeft size={19} /><span>Back to workspace</span></Link></nav></aside><section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>Settings</strong></div></header><div className="content admin-manage-content"><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">System controls</p><h1>Settings<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Review the services that keep the vault private and available.</p>{message && <p className="manage-message">{message}</p>}<section className="settings-grid"><div className="settings-card"><div className="settings-card-heading"><LockKey size={20} /><h2>Private storage</h2></div><p>Files are kept in a private Cloudflare R2 bucket and served through temporary signed URLs.</p><span className={`settings-status ${status?.r2 ? "ready" : "missing"}`}>{status?.r2 ? <CheckCircle size={16} /> : <ShieldCheck size={16} />}{status?.r2 ? "R2 is configured" : "R2 configuration needs attention"}</span></div><div className="settings-card"><div className="settings-card-heading"><CheckCircle size={20} /><h2>Database and auth</h2></div><p>Supabase provides member sign-in, profiles, permissions, and material metadata.</p><span className={`settings-status ${status?.supabase ? "ready" : "missing"}`}>{status?.supabase ? <CheckCircle size={16} /> : <ShieldCheck size={16} />}{status?.supabase ? "Supabase is configured" : "Supabase configuration needs attention"}</span></div></section><div className="admin-note"><div className="admin-note-icon"><LockKey size={19} /></div><div><strong>Secrets stay server-side</strong><p>Storage credentials are never exposed in this dashboard. Rotate R2 keys if they were shared outside your private environment.</p></div></div></div></section></main>;
}
