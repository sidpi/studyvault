"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookmarkSimple,
  Books,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChartLineUp,
  Clock,
  FilePdf,
  FolderSimple,
  FolderPlus,
  GearSix,
  House,
  MagnifyingGlass,
  Moon,
  Newspaper,
  Plus,
  Sparkle,
  Sun,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";
import { createSubject, groupByYear, SEMESTERS, YEARS, semesterLabel, subjectSlug } from "@/lib/library";

type Material = {
  title: string;
  subject: string;
  type: "PDF" | "PPT";
  size: string;
  updated: string;
  color: string;
  icon: "pdf" | "ppt";
};

const navItems = [
  { label: "Overview", icon: House },
  { label: "Recent", icon: Clock },
  { label: "Bookmarks", icon: BookmarkSimple },
  { label: "Blog", icon: Newspaper },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [liveMaterials, setLiveMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; year: number; semester: number }[]>([]);
  const [libraryError, setLibraryError] = useState("");
  const [displayName, setDisplayName] = useState("StudyVault member");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [storage, setStorage] = useState<{ objectCount: number; totalBytes: number } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectYear, setNewSubjectYear] = useState(1);
  const [newSubjectSemester, setNewSubjectSemester] = useState(1);
  const [savingSubject, setSavingSubject] = useState(false);
  const { supabase } = useSupabase();
  const router = useRouter();
  const canManage = role === "uploader" || role === "super_admin";

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem("theme", next);
      return next;
    });
  }

  useEffect(() => {
    let mounted = true;

    async function loadVault() {
      const { data: userResult } = await supabase.auth.getUser();
      if (!userResult.user) return;
      const profileResult = await supabase.from("profiles").select("display_name, role").eq("id", userResult.user.id).maybeSingle();
      if (profileResult.data) {
        setDisplayName(profileResult.data.display_name ?? "StudyVault member");
        setRole(profileResult.data.role ?? "user");
      }
      const [materialResult, subjectResult] = await Promise.all([
        supabase
          .from("materials")
          .select("title, file_size, mime_type, created_at, subjects(name)")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.from("subjects").select("id, name, year, semester").order("year").order("semester").order("name"),
      ]);

      if (!mounted) return;

      if (!materialResult.error && Array.isArray(materialResult.data)) {
        setLiveMaterials(
          materialResult.data.map((item: {
            title: string;
            file_size: number | null;
            mime_type: string | null;
            created_at: string;
            subjects?: { name?: string } | null;
          }, index: number) => ({
            title: item.title,
            subject: item.subjects?.name ?? "Study material",
            type: item.mime_type?.includes("presentation") ? "PPT" : "PDF",
            size: item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(1)} MB` : "File",
            updated: index === 0 ? "Today" : "Recently",
            color: ["coral", "mint", "blue", "lavender"][index % 4],
            icon: item.mime_type?.includes("presentation") ? "ppt" : "pdf",
          })),
        );
      }

      if (!subjectResult.error && Array.isArray(subjectResult.data)) {
        setSubjects(subjectResult.data);
      } else if (subjectResult.error) {
        setLibraryError("Run supabase/migrations/0002_year_semester_subjects.sql to enable the year/semester library.");
      }

      const storageResponse = await fetch("/api/storage");
      if (storageResponse.ok) {
        const storageData = await storageResponse.json() as { objectCount: number; totalBytes: number };
        if (mounted) setStorage(storageData);
      }
    }

    void loadVault();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    else router.push("/login");
  }

  async function handleCreateSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newSubjectName.trim() || savingSubject) return;
    setSavingSubject(true);
    setMessage("");
    try {
      const created = await createSubject(supabase, { name: newSubjectName, year: newSubjectYear, semester: newSubjectSemester });
      setSubjects((current) => [...current, created].sort((a, b) => a.year - b.year || a.semester - b.semester || a.name.localeCompare(b.name)));
      setMessage(`"${created.name}" added to Year ${created.year} · ${semesterLabel(created.semester)} with Notes and Reference Books folders.`);
      setNewSubjectName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the subject.");
    } finally {
      setSavingSubject(false);
    }
  }

  const filteredMaterials = useMemo(
    () =>
      liveMaterials.filter((material) =>
        `${material.title} ${material.subject}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [liveMaterials, query],
  );

  const years = useMemo(() => groupByYear(subjects), [subjects]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkle size={18} weight="fill" /></div>
          <span>StudyVault</span>
        </div>

        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.label;
            return (
              item.label === "Bookmarks" ? (
                <Link className={`side-nav-item ${active ? "active" : ""}`} key={item.label} href="/bookmarks">
                  <Icon size={19} weight={active ? "fill" : "regular"} />
                  <span>{item.label}</span>
                </Link>
              ) : item.label === "Blog" ? (
                <Link className={`side-nav-item ${active ? "active" : ""}`} key={item.label} href="/blog">
                  <Icon size={19} weight={active ? "fill" : "regular"} />
                  <span>{item.label}</span>
                </Link>
              ) : <button className={`side-nav-item ${active ? "active" : ""}`} key={item.label} onClick={() => setActiveNav(item.label)}>
                <Icon size={19} weight={active ? "fill" : "regular"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-label sidebar-label-spaced">Manage</div>
        <nav className="side-nav" aria-label="Management navigation">
          {canManage ? (
            <Link className="side-nav-item" href="/admin/materials/upload">
              <UploadSimple size={19} />
              <span>Upload materials</span>
            </Link>
          ) : (
            <button className="side-nav-item" onClick={() => setActiveNav("Upload materials")}>
              <UploadSimple size={19} />
              <span>Upload materials</span>
            </button>
          )}
          <button className="side-nav-item" onClick={() => setActiveNav("Activity")}>
            <ChartLineUp size={19} />
            <span>Activity</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-card">
            <div className="storage-heading"><span>Storage used</span><span>{storage ? `${(storage.totalBytes / 1024 / 1024).toFixed(1)} MB` : "—"}</span></div>
            <div className="storage-track"><span style={{ width: storage ? `${Math.min(100, (storage.totalBytes / (10 * 1024 * 1024 * 1024)) * 100)}%` : "0%" }} /></div>
            <p>{storage ? `${storage.objectCount} file${storage.objectCount === 1 ? "" : "s"} in Cloudflare R2` : "Loading storage usage..."}</p>
          </div>
          <Link className="side-nav-item" href={role === "super_admin" ? "/admin/settings" : "/profile"}>
            <GearSix size={19} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="search-box">
              <MagnifyingGlass size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your vault" aria-label="Search your vault" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" onClick={toggleTheme} aria-label="Toggle dark mode">{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
            <Link className="icon-button" href={role === "super_admin" ? "/admin/settings" : "/profile"} aria-label="Settings"><GearSix size={19} /></Link>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => setShowProfile(!showProfile)} onDoubleClick={() => void signOut()} aria-expanded={showProfile} title="Double-click to sign out">
                <span className="avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="profile-name">{displayName}</span>
                <CaretDown size={15} />
              </button>
              {showProfile && <div className="profile-menu"><strong>{displayName}</strong><span>{role === "super_admin" ? "Super Admin" : role === "uploader" ? "Uploader" : "Member account"}</span><Link href="/profile">View profile</Link>{role === "super_admin" && <Link href="/admin">Admin workspace</Link>}<button type="button" onClick={() => void signOut()}>Logout</button></div>}
            </div>
          </div>
        </header>

        <div className="content">
          {message && <p className="manage-message">{message}</p>}
          <div className="welcome-row">
            <div>
              <p className="eyebrow">Wednesday, August 26</p>
              <h1>Good morning, {displayName}<span className="coral-dot">.</span></h1>
              <p className="welcome-copy">Pick up where you left off, or find something new to study.</p>
            </div>
            {canManage && <Link className="primary-button" href="/admin/materials/upload"><Plus size={18} weight="bold" /> Add material</Link>}
          </div>

          <div className="section-heading">
            <div><h2>Recently added</h2><p>Live materials from your study group.</p></div>
            <Link href="/subjects" className="text-button">View all <ArrowRight size={16} /></Link>
          </div>
          <section className="material-grid">
            {filteredMaterials.map((material) => (
              <article className="material-card" key={material.title}>
                <div className={`file-icon ${material.color}`}><FilePdf size={27} weight="fill" /></div>
                <div className="material-body">
                  <div className="material-meta"><span>{material.subject}</span><span>{material.type}</span></div>
                  <h3>{material.title}</h3>
                  <div className="material-footer"><span>{material.size}</span><span>{material.updated}</span><button aria-label={`Bookmark ${material.title}`}><BookmarkSimple size={17} /></button></div>
                </div>
              </article>
            ))}
            {filteredMaterials.length === 0 && <div className="empty-state"><FilePdf size={24} /><p>{query ? `No materials match "${query}".` : "No materials have been added yet."}</p></div>}
          </section>

          <div className="section-heading">
            <div><h2>Library</h2><p>Material · Year · Semester · Subjects — every subject has Notes and Reference Books folders.</p></div>
            {canManage && (
              <button className="primary-button small" onClick={() => setManageOpen((open) => !open)}>
                <FolderPlus size={16} /> {manageOpen ? "Close" : "Add subject"}
              </button>
            )}
          </div>
          {libraryError && <p className="manage-message">{libraryError}</p>}
          {manageOpen && canManage && (
            <form className="upload-form compact-form subject-inline-form" onSubmit={handleCreateSubject}>
              <label>Name<input value={newSubjectName} onChange={(event) => setNewSubjectName(event.target.value)} placeholder="e.g. Engineering Mathematics" required /></label>
              <label>Year<select value={newSubjectYear} onChange={(event) => setNewSubjectYear(Number(event.target.value))}>{YEARS.map((year) => <option value={year} key={year}>Year {year}</option>)}</select></label>
              <label>Semester<select value={newSubjectSemester} onChange={(event) => setNewSubjectSemester(Number(event.target.value))}>{SEMESTERS.map((semester) => <option value={semester} key={semester}>{semesterLabel(semester)}</option>)}</select></label>
              <button className="primary-button" type="submit" disabled={savingSubject}>{savingSubject ? "Creating..." : <><Plus size={16} /> Create subject</>}</button>
              <button type="button" className="icon-button" aria-label="Close" onClick={() => setManageOpen(false)}><X size={16} /></button>
              <small>Notes and Reference Books folders are created automatically.</small>
            </form>
          )}
          <section className="yss-list">
            {years.map(({ year, semesters }) => {
              const open = openYear === year;
              const yearSubjectCount = semesters.reduce((sum, entry) => sum + entry.subjects.length, 0);
              return (
                <div className="yss-year" key={year}>
                  <button className="yss-year-heading" onClick={() => setOpenYear(open ? null : year)} aria-expanded={open}>
                    {open ? <CaretDown size={17} /> : <CaretRight size={17} />}
                    <strong>Year {year}</strong>
                    <span>{yearSubjectCount} subject{yearSubjectCount === 1 ? "" : "s"}</span>
                  </button>
                  {open && (
                    <div className="yss-semesters">
                      {semesters.map(({ semester, subjects: semesterSubjects }) => (
                        <div className="yss-semester" key={semester}>
                          <span className="yss-semester-name">{semesterLabel(semester)}</span>
                          <div className="yss-folders">
                            {semesterSubjects.map((subject) => (
                              <Link className="yss-folder" href={`/subjects/${subjectSlug(subject.name)}`} key={subject.id}>
                                <FolderSimple size={15} weight="fill" />
                                <span>{subject.name}</span>
                              </Link>
                            ))}
                            {semesterSubjects.length === 0 && <span className="no-categories">No subjects yet</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <div className="lower-grid">
            <section>
              <div className="section-heading compact"><div><h2>Keep studying</h2><p>Open a subject folder to continue.</p></div><Link href="/subjects" className="text-button">Library <ArrowRight size={16} /></Link></div>
              <div className="empty-state"><Books size={24} /><p>Your live study activity will appear here as you use the vault.</p></div>
            </section>
            <section className="activity-panel"><div className="section-heading compact"><div><h2>Study material</h2><p>Recently added files across all subjects.</p></div><CalendarBlank size={22} /></div><div className="empty-state"><Books size={24} /><p>Your live study activity will appear here as you use the vault.</p></div></section>
          </div>
        </div>
      </section>
    </main>
  );
}
