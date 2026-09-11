"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileArrowUp, ShieldCheck, Sparkle, UploadSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";
import { fetchAllSubjects, SEMESTERS, YEARS, semesterLabel, type SubjectRow } from "@/lib/library";

export default function UploadMaterialPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [subjectId, setSubjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
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
    void fetchAllSubjects(supabase)
      .then((rows) => { if (mounted) setSubjects(rows); })
      .catch(() => { if (mounted) setStatus("Could not load subjects. Run supabase/migrations/0002_year_semester_subjects.sql."); });
    return () => { mounted = false; };
  }, [router, supabase]);

  const subjectOptions = useMemo(
    () => subjects.filter((subject) => subject.year === year && subject.semester === semester),
    [subjects, year, semester],
  );
  const activeSubject = subjectOptions.find((subject) => subject.id === subjectId) ?? null;
  const selectedSubjectId = activeSubject?.id ?? "";
  const [fetchedCategories, setFetchedCategories] = useState<{ subjectId: string; rows: { id: string; name: string; subject_id: string }[] }>({ subjectId: "", rows: [] });

  useEffect(() => {
    let mounted = true;
    if (!selectedSubjectId) return;
    void supabase.from("categories").select("id, name, subject_id").eq("subject_id", selectedSubjectId).order("name")
      .then((result: { data: Array<{ id: string; name: string; subject_id: string }> | null }) => {
        if (!mounted) return;
        setFetchedCategories({ subjectId: selectedSubjectId, rows: result.data ?? [] });
      });
    return () => { mounted = false; };
  }, [selectedSubjectId, supabase]);

  const categories = fetchedCategories.subjectId === selectedSubjectId ? fetchedCategories.rows : [];
  const activeCategory = categories.find((category) => category.id === categoryId) ?? null;
  const selectedCategoryId = activeCategory?.id ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !selectedSubjectId || !selectedCategoryId) return setStatus("Choose a file, title, subject, and folder.");
    setBusy(true);
    setStatus("Preparing secure upload...");
    const signResponse = await fetch("/api/files/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream" }),
    });
    const signed = await signResponse.json() as { url?: string; fileKey?: string; error?: string };
    if (!signResponse.ok || !signed.url || !signed.fileKey) {
      setStatus(signed.error ?? "Unable to prepare the upload.");
      setBusy(false);
      return;
    }
    const uploadResponse = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
    if (!uploadResponse.ok) {
      setStatus("The file could not be uploaded to R2.");
      setBusy(false);
      return;
    }
    const { data: material, error } = await supabase.from("materials").insert({
      title,
      subject_id: selectedSubjectId,
      category_id: selectedCategoryId,
      file_name: file.name,
      file_key: signed.fileKey,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    }).select("id").single();
    if (!error && material) {
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase.from("activity_logs").insert({ user_id: currentUser.user?.id, action: "uploaded", resource_type: "material", resource_id: material.id, metadata: { file_name: file.name } });
    }
    setStatus(error ? "The file uploaded, but metadata could not be saved." : "Material uploaded successfully.");
    if (!error) { setFile(null); setTitle(""); }
    setBusy(false);
  }

  if (checking) return <main className="loading-screen"><Sparkle size={20} weight="fill" /><span>Checking uploader access...</span></main>;
  if (!allowed) return <main className="loading-screen"><ShieldCheck size={24} /><h1>Uploader permissions required.</h1><button className="outline-button" onClick={() => router.push("/")}>Back to workspace</button></main>;

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item active" href="/admin/materials/upload"><UploadSimple size={19} /><span>Upload materials</span></Link><Link className="side-nav-item" href="/"><ArrowLeft size={19} /><span>Back to overview</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><strong>Upload material</strong></div></header>
        <div className="content upload-content"><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to overview</Link><p className="eyebrow">Uploader workspace</p><h1>Add a material<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Pick the year, semester, subject, and folder — the file appears inside that folder for everyone.</p>
          <form className="upload-form" onSubmit={handleSubmit}>
            <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Unit 3 revision notes" /></label>
            <div className="subject-inline-form">
              <label>Year<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{YEARS.map((entry) => <option value={entry} key={entry}>Year {entry}</option>)}</select></label>
              <label>Semester<select value={semester} onChange={(event) => setSemester(Number(event.target.value))}>{SEMESTERS.map((entry) => <option value={entry} key={entry}>{semesterLabel(entry)}</option>)}</select></label>
            </div>
            <label>Subject<select value={selectedSubjectId} onChange={(event) => { setSubjectId(event.target.value); setCategoryId(""); }} required><option value="">{subjectOptions.length ? "Choose a subject" : `No subjects in Year ${year} · ${semesterLabel(semester)}`}{subjectOptions.length ? "" : " — add one first"}</option>{subjectOptions.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label>
            <label>Folder<select value={selectedCategoryId} onChange={(event) => setCategoryId(event.target.value)} required disabled={!selectedSubjectId}><option value="">{selectedSubjectId ? "Choose a folder" : "Choose a subject first"}</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
            <label className="file-picker">File<input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span><FileArrowUp size={25} />{file ? file.name : "Choose a file from your device"}<small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PDF, PPT, DOC, or ZIP"}</small></span></label>
            <button className="primary-button upload-submit" disabled={busy}>{busy ? "Uploading..." : <><UploadSimple size={18} /> Upload securely</>}</button>
            {status && <p className={`upload-status ${status.includes("successfully") ? "success" : ""}`}>{status.includes("successfully") && <Check size={17} weight="bold" />}{status}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
