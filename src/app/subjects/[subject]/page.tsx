"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookmarkSimple, FilePdf, FolderSimple, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

type Material = { id: string; title: string; description: string; type: string; size: string; category: string };

const fallbackMaterials: Material[] = [
  { id: "electromagnetic-induction", title: "Electromagnetic Induction", description: "Revision notes covering Faraday's law, Lenz's law, and practical applications.", type: "PDF", size: "2.4 MB", category: "Notes" },
  { id: "waves-and-optics", title: "Waves and Optics", description: "A concise guide to interference, diffraction, and wave behaviour.", type: "PDF", size: "1.6 MB", category: "Notes" },
  { id: "physics-pyq-2025", title: "Physics PYQ 2025", description: "Past questions selected for focused exam practice.", type: "PDF", size: "3.1 MB", category: "Question papers" },
];

export default function SubjectDetailPage() {
  const params = useParams<{ subject: string }>();
  const subjectName = decodeURIComponent(params.subject).replace(/\b\w/g, (letter) => letter.toUpperCase());
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState(fallbackMaterials);
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function loadMaterials() {
      const subjectResult = await supabase.from("subjects").select("id, name").ilike("name", subjectName).maybeSingle();
      if (subjectResult.error || !subjectResult.data) return;
      const materialResult = await supabase
        .from("materials")
        .select("id, title, description, mime_type, file_size, categories(name)")
        .eq("subject_id", subjectResult.data.id)
        .order("created_at", { ascending: false });
      if (!mounted || materialResult.error || !Array.isArray(materialResult.data) || materialResult.data.length === 0) return;
      setMaterials(materialResult.data.map((item: {
        id: string;
        title: string;
        description?: string | null;
        mime_type?: string | null;
        file_size?: number | null;
        categories?: { name?: string } | null;
      }) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? "Open this material to start studying.",
        type: item.mime_type?.includes("presentation") ? "PPT" : "PDF",
        size: item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(1)} MB` : "File",
        category: item.categories?.name ?? "Material",
      })));
    }
    void loadMaterials();
    return () => { mounted = false; };
  }, [subjectName, supabase]);

  const filteredMaterials = useMemo(
    () => materials.filter((material) => `${material.title} ${material.description} ${material.category}`.toLowerCase().includes(query.toLowerCase())),
    [materials, query],
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link className="side-nav-item" href="/"><span>Overview</span></Link>
          <Link className="side-nav-item active" href="/subjects"><FolderSimple size={19} weight="fill" /><span>Subjects</span></Link>
        </nav>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><Link href="/subjects" className="breadcrumb-link">Subjects</Link><span className="breadcrumb-slash">/</span><strong>{subjectName}</strong></div>
          <label className="search-box"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this subject" aria-label="Search this subject" /></label>
        </header>
        <div className="content">
          <Link href="/subjects" className="back-link"><ArrowLeft size={15} /> All subjects</Link>
          <div className="detail-heading">
            <div><p className="eyebrow">Subject library</p><h1>{subjectName}<span className="coral-dot">.</span></h1><p className="welcome-copy">Notes, questions, and references collected for your next study session.</p></div>
            <div className="subject-detail-icon coral"><FolderSimple size={31} weight="fill" /></div>
          </div>
          <section className="material-list">
            {filteredMaterials.map((material) => (
              <Link className="material-list-row" href={`/materials/${material.id}`} key={material.id}>
                <div className="file-icon small coral"><FilePdf size={22} weight="fill" /></div>
                <div className="material-list-copy"><span>{material.category} / {material.type}</span><h2>{material.title}</h2><p>{material.description}</p></div>
                <span className="material-size">{material.size}</span><BookmarkSimple className="material-bookmark" size={18} /><ArrowRight className="material-arrow" size={18} />
              </Link>
            ))}
            {filteredMaterials.length === 0 && <div className="empty-state"><MagnifyingGlass size={24} /><p>No material matches “{query}”.</p></div>}
          </section>
        </div>
      </section>
    </main>
  );
}
