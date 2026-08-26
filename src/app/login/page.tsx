"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKey, Sparkle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else router.push("/");
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual"><Link className="auth-brand" href="/"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</Link><div className="auth-quote"><p>“A clear mind needs a clear place to return to.”</p><span>Private study workspace</span></div><div className="auth-visual-shape" /></section>
      <section className="auth-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</div><p className="eyebrow">Welcome back</p><h1>Return to your<br /><em>focus.</em></h1><p className="auth-copy">Sign in to pick up your notes, saved materials, and study rhythm.</p>
        <form className="auth-form" onSubmit={handleLogin}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></label><div className="forgot-row"><Link href="/forgot-password">Forgot password?</Link></div><button className="primary-button auth-submit" disabled={loading}>{loading ? "Signing in..." : <>Sign in <ArrowRight size={17} /></>}</button>{message && <p className="auth-error">{message}</p>}</form>
        <p className="auth-footer">New to StudyVault? <Link href="/signup">Request access <ArrowRight size={14} /></Link></p><div className="auth-private"><LockKey size={15} /> Your materials stay private.</div>
      </div></section>
    </main>
  );
}
