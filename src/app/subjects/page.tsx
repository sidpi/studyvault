"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Books, FolderSimple, FolderPlus, MagnifyingGlass, Plus, Sparkle, X } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";
import { createSubject, groupByYear, SEMESTERS, YEARS, semesterLabel, subjectSlug } from "@/lib/library";

export default function SubjectsPage() {
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string; year: number; semester: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("user");
  const { supabase } = useSupabase();
  const canManage = role === "uploader" || role === "super_admin";

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [userResult, subjectResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("subjects").select("id, name, year, semester").order("year").order("semester").order("name"),
      ]);
      if (!mounted) return;
      if (subjectResult.error) setError(subjectResult.error.message);
      else setSubjects(subjectResult.data ?? []);
      if (userResult.data.user) {
        const profile = await supabase.from("profiles").select("role").eq("id", userResult.data.user.id).maybeSingle();
        if (profile.data?.role) setRole(profile.data.role);
      }
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [supabase]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const created = await createSubject(supabase, { name, year, semester });
      setSubjects((current) => [...current, created].sort((a, b) => a.year - b.year || a.semester - b.semester || a.name.localeCompare(b.name)));
      setMessage(`"${created.name}" created with Notes and Reference Books folders.`);
      setName("");
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : "Unable to create the subject.");
    } finally {
      setSaving(false);
    }
  }

  const years = useMemo(() => groupByYear(subjects), [subjects]);
  const needle = query.trim().toLowerCase();
  const visibleYears = useMemo(
    () => years.map((entry) => ({
      ...entry,
      semesters: entry.semesters.map((semesterEntry) => ({
        ...semesterEntry,
        subjects: needle ? semesterEntry.subjects.filter((subject) => subject.name.toLowerCase().includes(needle)) : semesterEntry.subjects,
      })),
    })).filter((entry) => entry.semesters.some((semesterEntry) => semesterEntry.subjects.length > 0) || !needle),
    [years, needle],
  );

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
          <div className="library-heading-row">
            <div>
              <p className="eyebrow">Your library</p>
              <h1>Subjects<span className="coral-dot">.</span></h1>
              <p className="welcome-copy subject-intro">Material is organised by year and semester. Every subject holds two folders: Notes and Reference Books.</p>
            </div>
            {canManage && (
              <button className="primary-button" onClick={() => setManageOpen((open) => !open)}>
                <FolderPlus size={17} /> {manageOpen ? "Close" : "Add subject"}
              </button>
            )}
          </div>
          {message && <p className={`manage-message ${message.includes("created") ? "success" : ""}`}>{message}</p>}
          {error && <p className="manage-message">{error}</p>}
          {manageOpen && canManage && (
            <form className="upload-form compact-form subject-inline-form" onSubmit={handleCreate}>
              <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Engineering Mathematics" required /></label>
              <label>Year<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{YEARS.map((entry) => <option value={entry} key={entry}>Year {entry}</option>)}</select></label>
              <label>Semester<select value={semester} onChange={(event) => setSemester(Number(event.target.value))}>{SEMESTERS.map((entry) => <option value={entry} key={entry}>{semesterLabel(entry)}</option>)}</select></label>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating..." : <><Plus size={16} /> Create subject</>}</button>
              <button type="button" className="icon-button" aria-label="Close" onClick={() => setManageOpen(false)}><X size={16} /></button>
              <small>Notes and Reference Books folders are created automatically.</small>
            </form>
          )}
          {loading ? (
            <div className="empty-state"><Sparkle size={24} /><p>Loading library...</p></div>
          ) : (
            <section className="yss-list subjects-page-list">
              {visibleYears.map(({ year: yearEntry, semesters }) => {
                const yearSubjectCount = semesters.reduce((sum, entry) => sum + entry.subjects.length, 0);
                return (
                  <div className="yss-year" key={yearEntry}>
                    <div className="yss-year-heading yss-year-static">
                      <Books size={17} />
                      <strong>Year {yearEntry}</strong>
                      <span>{yearSubjectCount} subject{yearSubjectCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="yss-semesters">
                      {semesters.map(({ semester: semesterEntry, subjects: semesterSubjects }) => (
                        <div className="yss-semester" key={semesterEntry}>
                          <span className="yss-semester-name">{semesterLabel(semesterEntry)}</span>
                          <div className="yss-folders">
                            {semesterSubjects.map((subject) => (
                              <Link className="yss-folder" href={`/subjects/${subjectSlug(subject.name)}`} key={subject.id}>
                                <FolderSimple size={15} weight="fill" />
                                <span>{subject.name}</span>
                              </Link>
                            ))}
                            {semesterSubjects.length === 0 && <span className="no-categories">{needle ? "No matching subjects" : "No subjects yet"}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && !needle && <div className="empty-state"><FolderSimple size={24} /><p>No subjects have been added yet.{canManage ? " Use “Add subject” to create the first one." : ""}</p></div>}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
