"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FilePdf, Sparkle } from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

type Option = { id: string; name: string };
type CategoryOption = Option & { subject_id: string };

export default function EditMaterialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [materialResult, subjectsResult, categoriesResult] = await Promise.all([
        supabase.from("materials").select("title, description, subject_id, category_id").eq("id", params.id).maybeSingle(),
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("categories").select("id, name, subject_id").order("name"),
      ]);
      if (!mounted) return;
      if (materialResult.data) {
        setTitle(materialResult.data.title);
        setDescription(materialResult.data.description ?? "");
        setSubjectId(materialResult.data.subject_id);
        setCategoryId(materialResult.data.category_id ?? "");
      }
      if (Array.isArray(subjectsResult.data)) setSubjects(subjectsResult.data);
      if (Array.isArray(categoriesResult.data)) setCategories(categoriesResult.data);
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [params.id, supabase]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("materials").update({ title: title.trim(), description: description.trim() || null, subject_id: subjectId, category_id: categoryId || null, updated_at: new Date().toISOString() }).eq("id", params.id);
    setMessage(error ? error.message : "Material updated.");
    setSaving(false);
    if (!error) setTimeout(() => router.push("/admin/materials"), 500);
  }

  if (loading) return <main className="loading-screen"><Sparkle size={20} weight="fill" /><span>Loading material...</span></main>;

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/materials"><FilePdf size={19} weight="fill" /><span>Materials</span></Link></nav></aside><section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin/materials" className="breadcrumb-link">Materials</Link><span className="breadcrumb-slash">/</span><strong>Edit</strong></div></header><div className="content upload-content"><Link href="/admin/materials" className="back-link"><ArrowLeft size={15} /> Materials</Link><p className="eyebrow">Content inventory</p><h1>Edit material<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Update the metadata without touching the file stored in R2.</p><form className="upload-form" onSubmit={save}><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="A short description for your study group." /></label><label>Subject<select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setCategoryId(""); }} required><option value="">Choose a subject</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label>Folder<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">No category</option>{categories.filter((category) => category.subject_id === subjectId).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><button className="primary-button upload-submit" disabled={saving}>{saving ? "Saving..." : <><Check size={17} /> Save changes</>}</button>{message && <p className="manage-message">{message}</p>}</form></div></section></main>;
}
