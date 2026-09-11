"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookmarkSimple, FilePdf, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type SavedMaterial = { id: string; title: string; description: string; subject: string; type: string };

export default function BookmarksPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SavedMaterial[]>([]);
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function loadBookmarks() {
      const { data: userResult } = await supabase.auth.getUser();
      if (!userResult.user) { setMessage("Sign in to see your saved materials."); return; }
      const { data, error } = await supabase.from("bookmarks").select("material_id, materials(id, title, description, mime_type, subjects(name))").eq("user_id", userResult.user.id);
      if (!mounted || error || !Array.isArray(data) || data.length === 0) return;
      setItems(data.map((item: { material_id: string; materials?: { id?: string; title?: string; description?: string | null; mime_type?: string | null; subjects?: { name?: string } | null } | null }) => ({
        id: item.materials?.id ?? item.material_id,
        title: item.materials?.title ?? "Saved material",
        description: item.materials?.description ?? "Open this material to continue studying.",
        subject: item.materials?.subjects?.name ?? "Study material",
        type: item.materials?.mime_type?.includes("presentation") ? "PPT" : "PDF",
      })));
    }
    void loadBookmarks();
    return () => { mounted = false; };
  }, [supabase]);

  const filteredItems = items.filter((item) => `${item.title} ${item.subject} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Workspace</div><nav className="side-nav"><Link className="side-nav-item" href="/"><span>Overview</span></Link><Link className="side-nav-item" href="/subjects"><span>Subjects</span></Link><Link className="side-nav-item active" href="/bookmarks"><BookmarkSimple size={19} weight="fill" /><span>Bookmarks</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><strong>Bookmarks</strong></div><label className="search-box"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookmarks" aria-label="Search bookmarks" /></label></header>
        <div className="content"><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to overview</Link><p className="eyebrow">Saved for later</p><h1>Your bookmarks<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">The materials you marked as worth another look.</p>
          {message && <div className="inline-message">{message} <Link href="/login">Sign in <ArrowRight size={14} /></Link></div>}
          <section className="bookmark-list">{filteredItems.map((item) => <Link className="bookmark-row" href={`/materials/${item.id}`} key={item.id}><div className="file-icon small coral"><FilePdf size={22} weight="fill" /></div><div className="material-list-copy"><span>{item.subject} / {item.type}</span><h2>{item.title}</h2><p>{item.description}</p></div><BookmarkSimple className="bookmark-saved" size={19} weight="fill" /><ArrowRight className="material-arrow" size={18} /></Link>)}{filteredItems.length === 0 && <div className="empty-state"><MagnifyingGlass size={24} /><p>No bookmark matches “{query}”.</p></div>}</section>
        </div>
      </section>
    </main>
  );
}
