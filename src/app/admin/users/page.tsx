"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, Sparkle, UserCircle, UsersThree } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type Profile = { id: string; email: string; display_name: string | null; role: "user" | "uploader" | "super_admin" };

const roleLabels = { user: "Member", uploader: "Uploader", super_admin: "Super Admin" };

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase.from("profiles").select("id, email, display_name, role").order("created_at", { ascending: true });
    if (error) setMessage(error.message);
    else if (Array.isArray(data)) setProfiles(data);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProfiles(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfiles]);

  async function changeRole(id: string, role: Profile["role"]) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    setMessage(error ? error.message : "Role updated.");
    if (!error) {
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase.from("activity_logs").insert({ user_id: currentUser.user?.id, action: "role_changed", resource_type: "profile", resource_id: id, metadata: { role } });
    }
    if (!error) await loadProfiles();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/users"><UsersThree size={19} weight="fill" /><span>People</span></Link><Link className="side-nav-item" href="/admin/subjects"><span>Subjects</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>People</strong></div></header><div className="content admin-manage-content"><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">Access control</p><h1>People in the vault<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Keep access simple. Give each person only the role they need.</p>{message && <p className="manage-message">{message}</p>}<section className="people-list">{profiles.length === 0 && <div className="empty-state"><UserCircle size={24} /><p>No profiles are visible yet.</p></div>}{profiles.map((profile) => <div className="person-row" key={profile.id}><div className="profile-avatar small-avatar">{(profile.display_name || profile.email).slice(0, 2).toUpperCase()}</div><div className="person-copy"><strong>{profile.display_name || "StudyVault member"}</strong><span>{profile.email}</span></div><div className="role-control"><select value={profile.role} onChange={(event) => void changeRole(profile.id, event.target.value as Profile["role"])} aria-label={`Role for ${profile.email}`}>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{profile.role === "super_admin" && <ShieldCheck size={17} />}</div></div>)}</section><div className="admin-note"><div className="admin-note-icon"><Check size={19} weight="bold" /></div><div><strong>Roles update instantly</strong><p>Uploader access can manage materials, while Super Admin access includes people and library structure.</p></div></div></div></section>
    </main>
  );
}
