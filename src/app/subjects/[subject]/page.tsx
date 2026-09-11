"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookmarkSimple, Books, FilePdf, FolderSimple, FolderOpen, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/lib/supabase";
import { SUBJECT_FOLDERS, type SubjectFolder } from "@/lib/library";

type Material = { id: string; title: string; description: string; type: string; size: string; category: string };

function SubjectDetailContent() {
  const params = useParams<{ subject: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawName = decodeURIComponent(params.subject);
  const subjectName = rawName.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const requestedFolder = searchParams.get("folder");
  const activeFolder: SubjectFolder = (SUBJECT_FOLDERS as readonly string[]).includes(requestedFolder ?? "")
    ? (requestedFolder as SubjectFolder)
    : SUBJECT_FOLDERS[0];
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function loadMaterials() {
      setLoading(true);
      const subjectResult = await supabase.from("subjects").select("id, name").ilike("name", rawName).maybeSingle();
      if (!mounted) return;
      if (subjectResult.error || !subjectResult.data) {
        setMaterials([]);
        setLoading(false);
        return;
      }
      const materialResult = await supabase
        .from("materials")
        .select("id, title, description, mime_type, file_size, categories(name)")
        .eq("subject_id", subjectResult.data.id)
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (materialResult.error || !Array.isArray(materialResult.data)) {
        setMaterials([]);
        setLoading(false);
        return;
      }
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
        category: item.categories?.name ?? "Notes",
      })));
      setLoading(false);
    }
    void loadMaterials();
    return () => { mounted = false; };
  }, [rawName, supabase]);

  const folderMaterials = useMemo(
    () => materials.filter((material) => material.category === activeFolder),
    [materials, activeFolder],
  );

  const filteredMaterials = useMemo(
    () => folderMaterials.filter((material) => `${material.title} ${material.description}`.toLowerCase().includes(query.toLowerCase())),
    [folderMaterials, query],
  );

  function selectFolder(folder: SubjectFolder) {
    router.replace(`/subjects/${encodeURIComponent(rawName.trim().toLowerCase())}?folder=${encodeURIComponent(folder)}`, { scroll: false });
  }

  const folderIcons = { "Notes": Books, "Reference Books": FolderOpen } as const;

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
          <label className="search-box"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this folder" aria-label="Search this folder" /></label>
        </header>
        <div className="content">
          <Link href="/subjects" className="back-link"><ArrowLeft size={15} /> All subjects</Link>
          <div className="detail-heading">
            <div><p className="eyebrow">Subject library</p><h1>{subjectName}<span className="coral-dot">.</span></h1><p className="welcome-copy">Choose a folder to see its notes or reference books.</p></div>
            <div className="subject-detail-icon coral"><FolderSimple size={31} weight="fill" /></div>
          </div>
          <div className="folder-tabs" role="tablist" aria-label="Subject folders">
            {SUBJECT_FOLDERS.map((folder) => {
              const Icon = folderIcons[folder];
              const count = materials.filter((material) => material.category === folder).length;
              return (
                <button
                  key={folder}
                  role="tab"
                  aria-selected={activeFolder === folder}
                  className={`folder-tab ${activeFolder === folder ? "active" : ""}`}
                  onClick={() => selectFolder(folder)}
                >
                  <Icon size={19} weight={activeFolder === folder ? "fill" : "regular"} />
                  <span>{folder}</span>
                  <small>{count} file{count === 1 ? "" : "s"}</small>
                </button>
              );
            })}
          </div>
          {loading ? (
            <div className="empty-state"><Sparkle size={24} /><p>Loading materials...</p></div>
          ) : (
            <section className="material-list">
              {filteredMaterials.map((material) => (
                <Link className="material-list-row" href={`/materials/${material.id}`} key={material.id}>
                  <div className="file-icon small coral"><FilePdf size={22} weight="fill" /></div>
                  <div className="material-list-copy"><span>{material.category} / {material.type}</span><h2>{material.title}</h2><p>{material.description}</p></div>
                  <span className="material-size">{material.size}</span><BookmarkSimple className="material-bookmark" size={18} /><ArrowRight className="material-arrow" size={18} />
                </Link>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="empty-state">
                  <FolderSimple size={24} />
                  <p>{query ? `No material matches "${query}" in ${activeFolder}.` : `No files in ${activeFolder} yet. Uploads land here automatically.`}</p>
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SubjectDetailPage() {
  return (
    <Suspense fallback={<main className="loading-screen"><Sparkle size={20} weight="fill" /><span>Loading subject...</span></main>}>
      <SubjectDetailContent />
    </Suspense>
  );
}
