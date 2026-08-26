"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Books, FolderSimple, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type Subject = { name: string; description: string; count: string; color: string };

const fallbackSubjects: Subject[] = [
  { name: "Physics", description: "Mechanics, electricity, waves, and the ideas behind how the world moves.", count: "24 files", color: "coral" },
  { name: "Chemistry", description: "Reaction maps, organic structures, and the essentials worth revisiting.", count: "18 files", color: "mint" },
  { name: "Mathematics", description: "A clear home for calculus, algebra, and problem-solving practice.", count: "31 files", color: "blue" },
  { name: "Biology", description: "Systems, diagrams, and the living details that need repetition.", count: "15 files", color: "lavender" },
];

export default function SubjectsPage() {
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState(fallbackSubjects);
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function loadSubjects() {
      const { data, error } = await supabase.from("subjects").select("name, description").order("name");
      if (!mounted || error || !Array.isArray(data) || data.length === 0) return;
      setSubjects(data.map((subject: { name: string; description?: string | null }, index: number) => ({
        name: subject.name,
        description: subject.description ?? "Materials and notes for this subject.",
        count: "Ready to explore",
        color: ["coral", "mint", "blue", "lavender"][index % 4],
      })));
    }
    void loadSubjects();
    return () => { mounted = false; };
  }, [supabase]);

  const filteredSubjects = subjects.filter((subject) => subject.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link className="side-nav-item" href="/"><span>Overview</span></Link>
          <Link className="side-nav-item active" href="/subjects"><Books size={19} weight="fill" /><span>Subjects</span></Link>
        </nav>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><strong>Subjects</strong></div>
          <label className="search-box"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a subject" aria-label="Find a subject" /></label>
        </header>
        <div className="content subjects-content">
          <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to overview</Link>
          <p className="eyebrow">Your library</p>
          <h1>Subjects<span className="coral-dot">.</span></h1>
          <p className="welcome-copy subject-intro">Everything in your vault, grouped into a place you can return to.</p>
          <section className="subjects-grid">
            {filteredSubjects.map((subject) => (
              <Link href={`/subjects/${encodeURIComponent(subject.name.toLowerCase())}`} className="subject-card" key={subject.name}>
                <div className={`subject-card-icon ${subject.color}`}><FolderSimple size={25} weight="fill" /></div>
                <div className="subject-card-copy"><span>{subject.count}</span><h2>{subject.name}</h2><p>{subject.description}</p></div>
                <ArrowRight size={18} className="subject-arrow" />
              </Link>
            ))}
            {filteredSubjects.length === 0 && <div className="empty-state"><MagnifyingGlass size={24} /><p>No subject matches “{query}”.</p></div>}
          </section>
        </div>
      </section>
    </main>
  );
}
