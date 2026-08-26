"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderSimple, Plus, Sparkle, Trash, Books } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type Subject = { id: string; name: string; description: string | null };
type Category = { id: string; subject_id: string; name: string };

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();

  const loadData = useCallback(async () => {
    const [subjectResult, categoryResult] = await Promise.all([
      supabase.from("subjects").select("id, name, description").order("name"),
      supabase.from("categories").select("id, subject_id, name").order("name"),
    ]);
    if (Array.isArray(subjectResult.data)) {
      setSubjects(subjectResult.data);
      if (!selectedSubject && subjectResult.data[0]) setSelectedSubject(subjectResult.data[0].id);
    }
    if (Array.isArray(categoryResult.data)) setCategories(categoryResult.data);
  }, [selectedSubject, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function createSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("subjects").insert({ name: name.trim(), description: description.trim() || null });
    setMessage(error ? error.message : "Subject created.");
    if (!error) { setName(""); setDescription(""); await loadData(); }
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim() || !selectedSubject) return;
    const { error } = await supabase.from("categories").insert({ subject_id: selectedSubject, name: categoryName.trim() });
    setMessage(error ? error.message : "Category created.");
    if (!error) { setCategoryName(""); await loadData(); }
  }

  async function deleteSubject(id: string) {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    setMessage(error ? error.message : "Subject deleted.");
    if (!error) await loadData();
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    setMessage(error ? error.message : "Category deleted.");
    if (!error) await loadData();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/subjects"><Books size={19} weight="fill" /><span>Subjects</span></Link><Link className="side-nav-item" href="/admin/materials/upload"><span>Upload materials</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>Subjects</strong></div></header><div className="content admin-manage-content"><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">Library structure</p><h1>Shape the library<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Create the places where shared notes belong, then keep them tidy over time.</p>
        <div className="manage-grid"><section className="manage-form-card"><div className="manage-card-heading"><span className="subject-card-icon coral"><Books size={21} /></span><div><h2>New subject</h2><p>A broad area of study.</p></div></div><form className="upload-form compact-form" onSubmit={createSubject}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Physics" required /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs here?" rows={3} /></label><button className="primary-button" type="submit"><Plus size={17} /> Create subject</button></form></section>
          <section className="manage-form-card"><div className="manage-card-heading"><span className="subject-card-icon mint"><FolderSimple size={21} weight="fill" /></span><div><h2>New category</h2><p>A useful grouping inside a subject.</p></div></div><form className="upload-form compact-form" onSubmit={createCategory}><label>Subject<select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}><option value="">Choose a subject</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label>Name<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Notes" required /></label><button className="primary-button" type="submit"><Plus size={17} /> Create category</button></form></section></div>
        {message && <p className={`manage-message ${message.endsWith(".") && !message.includes(" ") ? "success" : ""}`}>{message}</p>}
        <section className="manage-list"><div className="section-heading compact"><div><h2>Current structure</h2><p>{subjects.length} subjects, {categories.length} categories</p></div></div>{subjects.map((subject) => <div className="manage-subject" key={subject.id}><div className="manage-subject-heading"><div><h2>{subject.name}</h2><p>{subject.description || "No description yet."}</p></div><button className="delete-button" onClick={() => deleteSubject(subject.id)} aria-label={`Delete ${subject.name}`}><Trash size={17} /></button></div><div className="category-chips">{categories.filter((category) => category.subject_id === subject.id).map((category) => <span className="category-chip" key={category.id}>{category.name}<button onClick={() => deleteCategory(category.id)} aria-label={`Delete ${category.name}`}><Trash size={12} /></button></span>)}{categories.filter((category) => category.subject_id === subject.id).length === 0 && <span className="no-categories">No categories yet</span>}</div></div>)}</section>
      </div></section>
    </main>
  );
}
