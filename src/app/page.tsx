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
  GearSix,
  House,
  MagnifyingGlass,
  Moon,
  Newspaper,
  Plus,
  Sparkle,
  Sun,
  UploadSimple,
} from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Material = {
  title: string;
  subject: string;
  type: "PDF" | "PPT";
  size: string;
  updated: string;
  color: string;
  icon: "pdf" | "ppt";
};

type Subject = { name: string; count: string; color: string; progress: string };

const navItems = [
  { label: "Overview", icon: House },
  { label: "Subjects", icon: Books },
  { label: "Recent", icon: Clock },
  { label: "Bookmarks", icon: BookmarkSimple },
  { label: "Blog", icon: Newspaper },
];

const yearSemester = Array.from({ length: 5 }, (_, index) => ({
  year: `Year ${index + 1}`,
  semesters: [
    { name: "Semester 1", folders: ["Notes", "Reference Books", "Assignments"] },
    { name: "Semester 2", folders: ["Notes", "Reference Books", "Assignments"] },
  ],
}));

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [liveMaterials, setLiveMaterials] = useState<Material[]>([]);
  const [liveSubjects, setLiveSubjects] = useState<Subject[]>([]);
  const [displayName, setDisplayName] = useState("StudyVault member");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [storage, setStorage] = useState<{ objectCount: number; totalBytes: number } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [openYear, setOpenYear] = useState<number | null>(null);
  const { supabase } = useSupabase();
  const router = useRouter();

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
        supabase.from("subjects").select("name").order("name").limit(8),
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
        setLiveSubjects(
          subjectResult.data.map((item: { name: string }, index: number) => ({
            name: item.name,
            count: "Ready to explore",
            color: ["coral", "mint", "blue", "lavender"][index % 4],
            progress: `${44 + ((index * 13) % 39)}%`,
          })),
        );
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

  const filteredMaterials = useMemo(
    () =>
      liveMaterials.filter((material) =>
        `${material.title} ${material.subject}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [liveMaterials, query],
  );

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
              item.label === "Subjects" ? (
                <Link className={`side-nav-item ${active ? "active" : ""}`} key={item.label} href="/subjects">
                  <Icon size={19} weight={active ? "fill" : "regular"} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                item.label === "Bookmarks" ? (
                  <Link className={`side-nav-item ${active ? "active" : ""}`} key={item.label} href="/bookmarks">
                    <Icon size={19} weight={active ? "fill" : "regular"} />
                    <span>{item.label}</span>
                    <span className="nav-count">3</span>
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
              )
            );
          })}
        </nav>

        <div className="sidebar-label sidebar-label-spaced">Manage</div>
        <nav className="side-nav" aria-label="Management navigation">
          <button className="side-nav-item" onClick={() => setActiveNav("Upload materials")}>
            <UploadSimple size={19} />
            <span>Upload materials</span>
          </button>
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
            {(role === "uploader" || role === "super_admin") && <Link className="primary-button" href="/admin/materials/upload"><Plus size={18} weight="bold" /> Add material</Link>}
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
            <div><h2>Year · Semester · Subjects</h2><p>Five years of study, organised into notes, reference books, and assignments.</p></div>
            <CalendarBlank size={22} />
          </div>
          <section className="yss-list">
            {yearSemester.map((year, yearIndex) => {
              const open = openYear === yearIndex;
              return (
                <div className="yss-year" key={year.year}>
                  <button className="yss-year-heading" onClick={() => setOpenYear(open ? null : yearIndex)} aria-expanded={open}>
                    {open ? <CaretDown size={17} /> : <CaretRight size={17} />}
                    <strong>{year.year}</strong>
                    <span>{year.semesters.length} semesters</span>
                  </button>
                  {open && (
                    <div className="yss-semesters">
                      {year.semesters.map((semester) => (
                        <div className="yss-semester" key={semester.name}>
                          <span className="yss-semester-name">{semester.name}</span>
                          <div className="yss-folders">
                            {semester.folders.map((folder) => (
                              <span className="yss-folder" key={`${semester.name}-${folder}`}>
                                <FolderSimple size={15} weight="fill" />
                                <span>{folder}</span>
                              </span>
                            ))}
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
              <div className="section-heading compact"><div><h2>Your subjects</h2><p>Subjects currently in the vault.</p></div><Link href="/subjects" className="text-button">Browse <ArrowRight size={16} /></Link></div>
              <div className="subject-list">
                {liveSubjects.map((subject) => (
                  <Link className="subject-row" href={`/subjects/${encodeURIComponent(subject.name)}`} key={subject.name}>
                    <span className={`subject-icon ${subject.color}`}><FolderSimple size={19} weight="fill" /></span>
                    <span className="subject-info"><strong>{subject.name}</strong><small>{subject.count}</small></span>
                    <span className="subject-progress"><span style={{ width: subject.progress }} /></span>
                    <ArrowRight size={17} />
                  </Link>
                ))}
                {liveSubjects.length === 0 && <div className="empty-state"><FolderSimple size={24} /><p>No subjects have been added yet.</p></div>}
              </div>
            </section>
            <section className="activity-panel"><div className="section-heading compact"><div><h2>Keep studying</h2><p>Open a subject to continue.</p></div><Books size={22} /></div><div className="empty-state"><Books size={24} /><p>Your live study activity will appear here as you use the vault.</p></div></section>
          </div>
        </div>
      </section>
    </main>
  );
}
