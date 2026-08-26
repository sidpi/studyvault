"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FloppyDisk, LockKey, Sparkle, UserCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [email, setEmail] = useState("Loading account...");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    async function loadProfile() {
      const result = await supabase.auth.getUser();
      if (!result.data.user) {
        router.replace("/login");
        return;
      }
      if (result.data.user.email) setEmail(result.data.user.email);
      const profileResult = await supabase.from("profiles").select("display_name, role").eq("id", result.data.user.id).maybeSingle();
      if (profileResult.data) {
        setDisplayName(profileResult.data.display_name ?? "");
        setRole(profileResult.data.role ?? "user");
      }
    }
    void loadProfile();
  }, [router, supabase]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { data: userResult } = await supabase.auth.getUser();
    if (!userResult.user) {
      setMessage("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() || null }).eq("id", userResult.user.id);
    setMessage(error ? error.message : "Profile updated.");
    setSaving(false);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    else router.push("/login");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Account</div><nav className="side-nav"><Link className="side-nav-item active" href="/profile"><UserCircle size={19} weight="fill" /><span>Profile</span></Link><Link className="side-nav-item" href="/"><ArrowLeft size={19} /><span>Back to workspace</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><strong>Profile</strong></div></header><div className="content profile-content"><p className="eyebrow">Your account</p><h1>Profile<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Your account details and the controls that keep your vault private.</p><section className="profile-card"><div className="profile-avatar">{(displayName || email).slice(0, 2).toUpperCase()}</div><div><span className="profile-role">{role.replace("_", " ")}</span><h2>{displayName || "StudyVault member"}</h2><p>{email}</p></div></section><form className="profile-edit-form" onSubmit={saveProfile}><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" maxLength={80} /></label><button className="primary-button" disabled={saving}><FloppyDisk size={17} /> {saving ? "Saving..." : "Save profile"}</button></form><section className="profile-security"><div><div className="profile-security-title"><LockKey size={18} /> Private access</div><p>Only approved members can open materials in this workspace.</p></div><Check size={19} /></section><button className="outline-button signout-button" onClick={signOut}>Sign out</button>{message && <p className={`auth-error ${message === "Profile updated." ? "auth-success" : ""}`}>{message}</p>}</div></section>
    </main>
  );
}
