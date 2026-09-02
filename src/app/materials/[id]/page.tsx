"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDown, BookmarkSimple, FilePdf, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Material = { title: string; description: string; mime_type: string; file_key: string; file_name: string; subject: string };

const emptyMaterial: Material = {
  title: "",
  description: "",
  mime_type: "application/pdf",
  file_key: "",
  file_name: "study-material",
  subject: "Study material",
};

export default function MaterialPage() {
  const params = useParams<{ id: string }>();
  const [material, setMaterial] = useState(emptyMaterial);
  const [fileUrl, setFileUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(760);
  const viewerRef = useRef<HTMLDivElement>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;
    async function loadMaterial() {
      const { data, error } = await supabase.from("materials").select("title, description, mime_type, file_key, file_name, subjects(name)").eq("id", params.id).maybeSingle();
      if (!mounted || error || !data) return;
      setMaterial({
        title: data.title,
        description: data.description ?? "Open this material to start studying.",
        mime_type: data.mime_type ?? "application/pdf",
        file_key: data.file_key ?? "",
        file_name: data.file_name ?? "study-material",
        subject: data.subjects?.name ?? "Study material",
      });
      const { data: userResult } = await supabase.auth.getUser();
      if (userResult.user) {
        const { data: bookmark } = await supabase.from("bookmarks").select("id").eq("user_id", userResult.user.id).eq("material_id", params.id).maybeSingle();
        if (bookmark) setSaved(true);
      }
      if (data.file_key) {
        const signedResponse = await fetch("/api/files/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey: data.file_key, disposition: "inline" }),
        });
        if (signedResponse.ok) {
          const signedData = await signedResponse.json() as { url?: string };
          if (signedData.url) setFileUrl(signedData.url);
        }
      }
      if (userResult.user) await supabase.from("activity_logs").insert({ user_id: userResult.user.id, action: "viewed", resource_type: "material", resource_id: params.id });
    }
    void loadMaterial();
    return () => { mounted = false; };
  }, [params.id, supabase]);

  useEffect(() => {
    const element = viewerRef.current;
    if (!element) return;
    const updateWidth = () => setViewerWidth(element.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  async function toggleBookmark() {
    const { data: userResult } = await supabase.auth.getUser();
    if (!userResult.user) {
      setSaveMessage("Sign in to save materials.");
      return;
    }

    if (saved) {
      const { error } = await supabase.from("bookmarks").delete().eq("user_id", userResult.user.id).eq("material_id", params.id);
      if (error) setSaveMessage("Unable to remove bookmark.");
      else { setSaved(false); setSaveMessage("Removed from bookmarks."); await supabase.from("activity_logs").insert({ user_id: userResult.user.id, action: "unbookmarked", resource_type: "material", resource_id: params.id }); }
    } else {
      const { error } = await supabase.from("bookmarks").insert({ user_id: userResult.user.id, material_id: params.id });
      if (error) setSaveMessage("Unable to save bookmark.");
      else { setSaved(true); setSaveMessage("Saved to bookmarks."); await supabase.from("activity_logs").insert({ user_id: userResult.user.id, action: "bookmarked", resource_type: "material", resource_id: params.id }); }
    }
  }

  async function logDownload() {
    const { data: userResult } = await supabase.auth.getUser();
    if (userResult.user) {
      await supabase.from("activity_logs").insert({
        user_id: userResult.user.id,
        action: "downloaded",
        resource_type: "material",
        resource_id: params.id,
        metadata: { file_name: material.file_name },
      });
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link className="side-nav-item" href="/"><span>Overview</span></Link>
          <Link className="side-nav-item active" href="/subjects"><span>Subjects</span></Link>
        </nav>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/subjects" className="breadcrumb-link">Subjects</Link><span className="breadcrumb-slash">/</span><strong>{material.title}</strong></div>
          <label className="search-box"><MagnifyingGlass size={18} /><input placeholder="Search your vault" aria-label="Search your vault" /></label>
        </header>
        <div className="content reader-content">
          <Link href="/subjects" className="back-link"><ArrowLeft size={15} /> Back to subjects</Link>
          <div className="reader-heading">
            <div><p className="eyebrow">{material.subject ? `${material.subject} / ` : ""}{material.mime_type.includes("pdf") ? "PDF" : "Document"}</p><h1>{material.title || "Loading material..."}<span className="coral-dot">.</span></h1><p className="welcome-copy">{material.description || "Open this material to start studying."}</p></div>
            <div className="reader-actions"><button className={`outline-button ${saved ? "saved-button" : ""}`} onClick={toggleBookmark}><BookmarkSimple size={17} weight={saved ? "fill" : "regular"} /> {saved ? "Saved" : "Save"}</button>{fileUrl ? <a className="primary-button" href={fileUrl} download={material.file_name} onClick={() => { void logDownload(); }}><ArrowDown size={17} /> Download</a> : <button className="primary-button" disabled><ArrowDown size={17} /> Download</button>}</div>
          </div>
          {saveMessage && <p className="save-message">{saveMessage}</p>}
          <section className="viewer-frame">
            <div className="viewer-toolbar"><span><FilePdf size={17} weight="fill" /> {material.file_name}</span><span>Private preview</span></div>
            {fileUrl && material.mime_type.includes("pdf") ? <div className="pdf-viewer" ref={viewerRef}><Document file={fileUrl} onLoadSuccess={({ numPages: pages }) => { setNumPages(pages); setPageNumber(1); }} loading={<div className="viewer-placeholder"><Sparkle size={28} weight="fill" /><h2>Loading document...</h2></div>} error={<div className="viewer-placeholder"><FilePdf size={42} weight="thin" /><h2>Unable to load this PDF</h2><p>Check the R2 CORS policy and signed URL configuration.</p></div>}><Page pageNumber={pageNumber} width={Math.max(320, Math.min(viewerWidth - 40, 900)) * scale} renderAnnotationLayer renderTextLayer /></Document><div className="pdf-controls"><button onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={pageNumber <= 1}>Previous</button><span>Page {pageNumber} of {numPages || "..."}</span><button onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))} disabled={!numPages || pageNumber >= numPages}>Next</button><button onClick={() => setScale((value) => Math.max(.75, value - .1))}>-</button><span>{Math.round(scale * 100)}%</span><button onClick={() => setScale((value) => Math.min(1.6, value + .1))}>+</button></div></div> : <div className="viewer-placeholder"><FilePdf size={42} weight="thin" /><h2>No preview available</h2><p>This material can be downloaded once a signed link is ready.</p></div>}
          </section>
        </div>
      </section>
    </main>
  );
}
