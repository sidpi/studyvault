"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowSquareOut,
  Books,
  CalendarBlank,
  Newspaper,
  Plus,
  Sparkle,
  Trophy,
  LinkSimple,
  User,
} from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";
import type { BlogPost, BlogPostCategory } from "@/types/supabase";

const categoryMeta: Record<BlogPostCategory, { label: string; icon: typeof Newspaper }> = {
  news: { label: "News", icon: Newspaper },
  event: { label: "Event", icon: CalendarBlank },
  course: { label: "Course link", icon: LinkSimple },
  competition: { label: "Competition", icon: Trophy },
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState<BlogPostCategory>("news");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();

  async function loadPosts() {
    const session = await supabase.auth.getSession();
    const response = await fetch("/api/posts", {
      headers: { Authorization: `Bearer ${session.data.session?.access_token ?? ""}` },
    });
    if (response.ok) {
      const data = await response.json() as { posts?: BlogPost[] };
      if (Array.isArray(data.posts)) setPosts(data.posts);
    } else if (response.status === 401) {
      setMessage("Sign in to read the blog.");
    }
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      const session = await supabase.auth.getSession();
      const response = await fetch("/api/posts", {
        headers: { Authorization: `Bearer ${session.data.session?.access_token ?? ""}` },
      });
      if (!mounted) return;
      if (response.ok) {
        const data = await response.json() as { posts?: BlogPost[] };
        if (mounted && Array.isArray(data.posts)) setPosts(data.posts);
      } else if (response.status === 401) {
        setMessage("Sign in to read the blog.");
      }
      if (mounted) setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [supabase]);

  async function submitPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, link, category }),
    });
    const result = await response.json() as { post?: BlogPost; error?: string };
    if (response.ok && result.post) {
      setTitle("");
      setBody("");
      setLink("");
      setCategory("news");
      setShowForm(false);
      setMessage("");
      void loadPosts();
    } else {
      setMessage(result.error ?? "Unable to publish your post.");
    }
    setSubmitting(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkle size={18} weight="fill" /></div><span>StudyVault</span></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link className="side-nav-item" href="/"><span>Overview</span></Link>
          <Link className="side-nav-item" href="/subjects"><Books size={19} /><span>Subjects</span></Link>
          <Link className="side-nav-item active" href="/blog"><Newspaper size={19} weight="fill" /><span>Blog</span></Link>
        </nav>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/" className="breadcrumb-link">Workspace</Link><span className="breadcrumb-slash">/</span><strong>Blog</strong></div>
          <div className="topbar-actions"></div>
        </header>
        <div className="content subjects-content">
          <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to overview</Link>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">Announcements</p>
              <h1>Blog<span className="coral-dot">.</span></h1>
              <p className="welcome-copy subject-intro">News, events, useful course links, and competition updates shared by the group.</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm((open) => !open)}><Plus size={18} weight="bold" /> {showForm ? "Close" : "New post"}</button>
          </div>

          {showForm && (
            <form className="upload-form blog-form" onSubmit={submitPost}>
              <label>Category
                <select value={category} onChange={(event) => setCategory(event.target.value as BlogPostCategory)}>
                  {(Object.keys(categoryMeta) as BlogPostCategory[]).map((key) => (
                    <option value={key} key={key}>{categoryMeta[key].label}</option>
                  ))}
                </select>
              </label>
              <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A short, clear headline" maxLength={140} required /></label>
              <label>Details<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What should the group know?" rows={4} required /></label>
              <label>Link <span className="blog-optional">optional</span><input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." inputMode="url" /></label>
              <button className="primary-button upload-submit" type="submit" disabled={submitting}>{submitting ? "Publishing..." : "Publish post"}</button>
            </form>
          )}
          {message && <p className="manage-message">{message}</p>}

          <section className="blog-list">
            {loading && <div className="empty-state"><Newspaper size={24} /><p>Loading posts...</p></div>}
            {!loading && posts.length === 0 && <div className="empty-state"><Newspaper size={24} /><p>No posts yet. Share the first update with your group.</p></div>}
            {posts.map((post) => {
              const meta = categoryMeta[post.category] ?? categoryMeta.news;
              const Icon = meta.icon;
              return (
                <article className="blog-post" key={post.id}>
                  <span className={`blog-category blog-category-${post.category}`}><Icon size={14} weight="fill" /> {meta.label}</span>
                  <h2>{post.title}</h2>
                  <p className="blog-body">{post.body}</p>
                  {post.link && <a className="blog-link" href={post.link} target="_blank" rel="noreferrer"><ArrowSquareOut size={14} /> Open link</a>}
                  <div className="blog-author"><User size={13} /><span>{post.author_name}</span><time>{new Date(post.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</time></div>
                </article>
              );
            })}
          </section>
        </div>
      </section>
    </main>
  );
}