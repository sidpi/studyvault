"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Books, FolderSimple, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";
import { createSubject, deleteSubject, fetchAllSubjects, SEMESTERS, SUBJECT_FOLDERS, YEARS, semesterLabel, type SubjectRow } from "@/lib/library";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [name, setName] = useState("");
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const { supabase } = useSupabase();

  const loadSubjects = useCallback(async () => {
    try {
      setSubjects(await fetchAllSubjects(supabase));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load subjects.");
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSubjects(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubjects]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const created = await createSubject(supabase, { name, year, semester });
      setMessage(`"${created.name}" created in Year ${created.year} · ${semesterLabel(created.semester)}. Notes and Reference Books folders were created automatically.`);
      setName("");
      await loadSubjects();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the subject.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, subjectName: string) {
    if (!window.confirm(`Delete "${subjectName}" and its folders? Materials stay in the vault but lose their subject.`)) return;
    try {
      await deleteSubject(supabase, id);
      setMessage(`"${subjectName}" deleted.`);
      await loadSubjects();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete the subject.");
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div><div className="sidebar-label">Manage</div><nav className="side-nav"><Link className="side-nav-item" href="/admin"><span>Admin overview</span></Link><Link className="side-nav-item active" href="/admin/subjects"><Books size={19} weight="fill" /><span>Subjects</span></Link><Link className="side-nav-item" href="/admin/materials/upload"><span>Upload materials</span></Link></nav></aside>
      <section className="main-panel"><header className="topbar"><div className="breadcrumb"><Link href="/admin" className="breadcrumb-link">Admin</Link><span className="breadcrumb-slash">/</span><strong>Subjects</strong></div></header><div className="content admin-manage-content"><Link href="/admin" className="back-link"><ArrowLeft size={15} /> Admin overview</Link><p className="eyebrow">Library structure</p><h1>Shape the library<span className="coral-dot">.</span></h1><p className="welcome-copy subject-intro">Add a subject to a year and semester. Each new subject automatically gets its Notes and Reference Books folders — no manual categories needed.</p>
        <div className="manage-grid manage-grid-single"><section className="manage-form-card"><div className="manage-card-heading"><span className="subject-card-icon coral"><Books size={21} /></span><div><h2>New subject</h2><p>Placed in a year and semester, with both folders ready.</p></div></div><form className="upload-form compact-form" onSubmit={handleCreate}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Engineering Mathematics" required /></label><div className="subject-inline-form"><label>Year<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{YEARS.map((entry) => <option value={entry} key={entry}>Year {entry}</option>)}</select></label><label>Semester<select value={semester} onChange={(event) => setSemester(Number(event.target.value))}>{SEMESTERS.map((entry) => <option value={entry} key={entry}>{semesterLabel(entry)}</option>)}</select></label></div><button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating..." : <><Plus size={17} /> Create subject</>}</button></form></section>
          <section className="manage-form-card"><div className="manage-card-heading"><span className="subject-card-icon mint"><FolderSimple size={21} weight="fill" /></span><div><h2>Fixed folders</h2><p>Created automatically for every subject.</p></div></div><div className="category-chips">{SUBJECT_FOLDERS.map((folder) => <span className="category-chip" key={folder}>{folder}</span>)}</div></section></div>
        {message && <p className={`manage-message ${message.includes("created") || message.includes("deleted") ? "success" : ""}`}>{message}</p>}
        <section className="manage-list"><div className="section-heading compact"><div><h2>Current structure</h2><p>{subjects.length} subject{subjects.length === 1 ? "" : "s"} across {YEARS.length} years</p></div></div>
          {YEARS.map((yearEntry) => {
            const yearSubjects = subjects.filter((subject) => subject.year === yearEntry);
            if (yearSubjects.length === 0) return null;
            return (
              <div key={yearEntry}>
                <p className="manage-year-label">Year {yearEntry}</p>
                {SEMESTERS.map((semesterEntry) => {
                  const semesterSubjects = yearSubjects.filter((subject) => subject.semester === semesterEntry);
                  if (semesterSubjects.length === 0) return null;
                  return (
                    <div key={semesterEntry}>
                      <p className="manage-semester-label">{semesterLabel(semesterEntry)}</p>
                      {semesterSubjects.map((subject) => (
                        <div className="manage-subject" key={subject.id}>
                          <div className="manage-subject-heading"><div><h2>{subject.name}</h2><p>Year {subject.year} · {semesterLabel(subject.semester)} · Notes + Reference Books</p></div><button className="delete-button" onClick={() => void handleDelete(subject.id, subject.name)} aria-label={`Delete ${subject.name}`}><Trash size={17} /></button></div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {subjects.length === 0 && <div className="empty-state"><FolderSimple size={24} /><p>No subjects yet. Create the first one above.</p></div>}
        </section>
      </div></section>
    </main>
  );
}
