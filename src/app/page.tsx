"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookmarkSimple,
  Books,
  CaretDown,
  ChartLineUp,
  Check,
  Clock,
  FilePdf,
  FolderSimple,
  GearSix,
  House,
  MagnifyingGlass,
  Plus,
  Sparkle,
  UploadSimple,
} from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

type Material = {
  title: string;
  subject: string;
  type: "PDF" | "PPT";
  size: string;
  updated: string;
  color: string;
  icon: "pdf" | "ppt";
};

const materials: Material[] = [
  { title: "Electromagnetic Induction", subject: "Physics", type: "PDF", size: "2.4 MB", updated: "Today", color: "coral", icon: "pdf" },
  { title: "Organic Chemistry Reactions", subject: "Chemistry", type: "PDF", size: "1.8 MB", updated: "Yesterday", color: "mint", icon: "pdf" },
  { title: "Calculus: Limits & Continuity", subject: "Mathematics", type: "PPT", size: "4.1 MB", updated: "2 days ago", color: "blue", icon: "ppt" },
  { title: "Human Anatomy: The Nervous System", subject: "Biology", type: "PDF", size: "3.6 MB", updated: "4 days ago", color: "lavender", icon: "pdf" },
];

const subjects = [
  { name: "Physics", count: "24 files", color: "coral", progress: "68%" },
  { name: "Chemistry", count: "18 files", color: "mint", progress: "52%" },
  { name: "Mathematics", count: "31 files", color: "blue", progress: "82%" },
  { name: "Biology", count: "15 files", color: "lavender", progress: "44%" },
];

const navItems = [
  { label: "Overview", icon: House },
  { label: "Subjects", icon: Books },
  { label: "Recent", icon: Clock },
  { label: "Bookmarks", icon: BookmarkSimple },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [liveMaterials, setLiveMaterials] = useState<Material[]>(materials);
  const [liveSubjects, setLiveSubjects] = useState(subjects);
  const { supabase } = useSupabase();

  useEffect(() => {
    let mounted = true;

    async function loadVault() {
      const [materialResult, subjectResult] = await Promise.all([
        supabase
          .from("materials")
          .select("title, file_size, mime_type, created_at, subjects(name)")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.from("subjects").select("name").order("name").limit(8),
      ]);

      if (!mounted) return;

      if (!materialResult.error && Array.isArray(materialResult.data) && materialResult.data.length > 0) {
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

      if (!subjectResult.error && Array.isArray(subjectResult.data) && subjectResult.data.length > 0) {
        setLiveSubjects(
          subjectResult.data.map((item: { name: string }, index: number) => ({
            name: item.name,
            count: "Ready to explore",
            color: ["coral", "mint", "blue", "lavender"][index % 4],
            progress: `${44 + ((index * 13) % 39)}%`,
          })),
        );
      }
    }

    void loadVault();
    return () => {
      mounted = false;
    };
  }, [supabase]);

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
            <div className="storage-heading"><span>Storage used</span><span>2.8 GB</span></div>
            <div className="storage-track"><span /></div>
            <p>of 10 GB available</p>
          </div>
          <button className="side-nav-item" onClick={() => setActiveNav("Settings")}>
            <GearSix size={19} />
            <span>Settings</span>
          </button>
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
            <button className="icon-button" aria-label="Settings"><GearSix size={19} /></button>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => setShowProfile(!showProfile)} aria-expanded={showProfile}>
                <span className="avatar">AK</span>
                <span className="profile-name">Aarav Kapoor</span>
                <CaretDown size={15} />
              </button>
              {showProfile && <div className="profile-menu"><strong>Aarav Kapoor</strong><span>Member account</span><Link href="/profile">View profile</Link><a href="/login">Sign out</a></div>}
            </div>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">Wednesday, August 26</p>
              <h1>Good morning, Aarav<span className="coral-dot">.</span></h1>
              <p className="welcome-copy">Pick up where you left off, or find something new to study.</p>
            </div>
            <Link className="primary-button" href="/admin/materials/upload"><Plus size={18} weight="bold" /> Add material</Link>
          </div>

          <section className="focus-card">
            <div className="focus-copy">
              <div className="focus-kicker"><Sparkle size={16} weight="fill" /> Your study focus</div>
              <h2>Make space for the<br /><em>hard</em> chapters.</h2>
              <p>You have been building momentum in Physics. Keep the streak going with one focused session today.</p>
              <button className="dark-button">Open Physics <ArrowRight size={17} /></button>
            </div>
            <div className="focus-art" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="focus-note"><span>01</span><b>FOCUS</b><small>PHYSICS</small></div>
              <div className="focus-line line-one" /><div className="focus-line line-two" />
            </div>
          </section>

          <div className="section-heading">
            <div><h2>Recently added</h2><p>Fresh material from your study group.</p></div>
            <button className="text-button">View all <ArrowRight size={16} /></button>
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
            {filteredMaterials.length === 0 && <div className="empty-state"><MagnifyingGlass size={24} /><p>No materials match “{query}”.</p></div>}
          </section>

          <div className="lower-grid">
            <section>
              <div className="section-heading compact"><div><h2>Your subjects</h2><p>Keep your syllabus within reach.</p></div><button className="text-button">Manage <ArrowRight size={16} /></button></div>
              <div className="subject-list">
                {liveSubjects.map((subject) => (
                  <button className="subject-row" key={subject.name}>
                    <span className={`subject-icon ${subject.color}`}><FolderSimple size={19} weight="fill" /></span>
                    <span className="subject-info"><strong>{subject.name}</strong><small>{subject.count}</small></span>
                    <span className="subject-progress"><span style={{ width: subject.progress }} /></span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
            </section>
            <section className="activity-panel">
              <div className="section-heading compact"><div><h2>Study activity</h2><p>Your rhythm this week.</p></div><button className="more-button" aria-label="More activity options">•••</button></div>
              <div className="activity-total"><strong>4h 32m</strong><span>+18% from last week</span></div>
              <div className="activity-chart" aria-label="Study activity chart">
                {[42, 66, 52, 84, 58, 38, 24].map((height, index) => <div className="bar-wrap" key={index}><span className={index === 3 ? "bar active-bar" : "bar"} style={{ height: `${height}%` }} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}
              </div>
              <div className="activity-note"><Check size={16} weight="bold" /> You are on track this week.</div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
