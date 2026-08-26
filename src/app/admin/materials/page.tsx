"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FilePdf, MagnifyingGlass, PencilSimple, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type Material = { id: string; title: string; file_name: string; mime_type: string; created_at: string; subjects?: { name?: string } | null };

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();
  const loadMaterials = useCallback(async () => {
    const { data, error } = await supabase.from("materials").select("id, title, file_name, mime_type, created_at, subjects(name)").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else if (Array.isArray(data)) setMaterials(data);
  }, [supabase]);
  useEffect(() => { const timer = window.setTimeout(() => { void loadMaterials(); }, 0); return () => window.clearTimeout(timer); }, [loadMaterials]);
  const filtered = useMemo(() => materials.filter((material) => `${material.title} ${material.file_name} ${material.subjects?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())), [materials, query]);
    async function removeMaterial(id: string) {
    if (!window.confirm("Delete this material from the vault?")) return;
    const response = await fetch("/api/files/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Material deleted." : result.error ?? "Unable to delete material.");
    if (response.ok) await loadMaterials();
  }

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/materials"><FilePdf size={19} weight="fill" /><span>Materials</span></Link><Link className="side-nav-item" href="/admin/subjects"><span>Subjects</span></Link></nav></aside><section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>Materials</strong></div><label className="search-box"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search materials" aria-label="Search materials" /></label></header><div className="content admin-manage-content"><div className="materials-header"><div><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">Content inventory</p><h1>Materials<span className="coral-dot">.</span></h1><p className="welcome-copy">Everything currently stored in the private vault.</p></div><Link href="/admin/materials/upload" className="primary-button"><Plus size={17} /> Upload material</Link></div>{message && <p className="manage-message">{message}</p>}<section className="admin-material-list">{filtered.map((material) => <div className="admin-material-row" key={material.id}><div className="file-icon small coral"><FilePdf size={21} weight="fill" /></div><div className="material-list-copy"><span>{material.subjects?.name ?? "Uncategorised"} / {material.mime_type.includes("presentation") ? "PPT" : "PDF"}</span><h2>{material.title}</h2><p>{material.file_name}</p></div><span className="admin-material-date">{new Date(material.created_at).toLocaleDateString()}</span>  <Link href={`/admin/materials/${material.id}/edit`} className="admin-row-button" aria-label={`Edit ${material.title}`}><PencilSimple size={17} /></Link><button className="admin-row-button danger" onClick={() => void removeMaterial(material.id)} aria-label={`Delete ${material.title}`}><Trash size={17} /></button></div>)}{filtered.length === 0 && <div className="empty-state"><MagnifyingGlass size={24} /><p>No materials found.</p></div>}</section></div></section></main>;
}
