"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Books, ChartLineUp, FilePdf, GearSix, ShieldCheck, Sparkle, UploadSimple, UsersThree } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

const actions = [
  { title: "Upload material", description: "Add a note, question paper, or reference to the vault.", href: "/admin/materials/upload", icon: UploadSimple, color: "coral" },
  { title: "Manage materials", description: "Review, open, and remove files already in the vault.", href: "/admin/materials", icon: FilePdf, color: "blue" },
  { title: "Manage subjects", description: "Keep the library structure clear and useful.", href: "/admin/subjects", icon: Books, color: "mint" },
  { title: "Manage people", description: "Choose who can read, upload, or manage the vault.", href: "/admin/users", icon: UsersThree, color: "lavender" },
  { title: "Review activity", description: "See what is being added and viewed across the group.", href: "/admin/activity", icon: ChartLineUp, color: "blue" },
];

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function checkAccess() {
      const { data: userResult } = await supabase.auth.getUser();
      if (!userResult.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle();
      if (!mounted) return;
      setAllowed(profile?.role === "uploader" || profile?.role === "super_admin");
      setChecking(false);
    }
    void checkAccess();
    return () => { mounted = false; };
  }, [router, supabase]);

  if (checking) return <main className="loading-screen"><Sparkle size={20} weight="fill" /><span>Checking workspace access...</span></main>;
  if (!allowed) return <main className="loading-screen"><ShieldCheck size={24} /><h1>Uploader access required.</h1><Link className="outline-button" href="/">Back to workspace</Link></main>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div>
        <div className="sidebar-label">Manage</div>
        <nav className="side-nav" aria-label="Admin navigation">
          <Link className="side-nav-item active" href="/admin"><ShieldCheck size={19} weight="fill" /><span>Admin overview</span></Link>
          <Link className="side-nav-item" href="/admin/materials/upload"><UploadSimple size={19} /><span>Upload materials</span></Link>
          <Link className="side-nav-item" href="/subjects"><Books size={19} /><span>Subjects</span></Link>
        </nav>
        <div className="sidebar-bottom"><Link className="side-nav-item" href="/"><ArrowLeft size={19} /><span>Back to workspace</span></Link></div>
      </aside>
      <section className="main-panel">
        <header className="topbar"><div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><strong>Admin overview</strong></div><div className="topbar-actions"><Link href="/" className="outline-button">Dashboard</Link><Link href="/admin/settings" aria-label="Admin settings"><GearSix size={19} className="admin-gear" /></Link></div></header>
        <div className="content admin-content">
          <p className="eyebrow">Owner workspace</p><h1>Keep the vault<br /><em>useful.</em><span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">A small set of tools for keeping shared learning materials organised and easy to find.</p>
          <div className="section-heading admin-section-heading"><div><h2>Manage the vault</h2><p>Choose where you want to make an update.</p></div></div>
          <section className="admin-actions">{actions.map((action) => { const Icon = action.icon; return <Link href={action.href} className="admin-action" key={action.title}><span className={`admin-action-icon ${action.color}`}><Icon size={23} /></span><span><h2>{action.title}</h2><p>{action.description}</p></span><ArrowRight size={18} /></Link>; })}</section>
          <section className="admin-note"><div className="admin-note-icon"><FilePdf size={21} /></div><div><strong>Private by default</strong><p>Files stay in R2 and are only exposed through short-lived signed URLs.</p></div><ShieldCheck size={21} /></section>
        </div>
      </section>
    </main>
  );
}
