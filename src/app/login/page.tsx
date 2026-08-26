"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKey, Sparkle, UsersThree, ShieldCheck } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"member" | "admin">("member");
  const router = useRouter();
  const { supabase } = useSupabase();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else {
      const { data: userResult } = await supabase.auth.getUser();
      const { data: profile } = userResult.user ? await supabase.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle() : { data: null };
      if (loginType === "admin" && profile?.role !== "super_admin") {
        await supabase.auth.signOut();
        setMessage("This account does not have Super Admin access.");
      }
      else router.push(loginType === "admin" ? "/admin" : "/");
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual"><Link className="auth-brand" href="/"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</Link><div className="auth-quote"><p>“A clear mind needs a clear place to return to.”</p><span>Private study workspace</span></div><div className="auth-visual-shape" /></section>
      <section className="auth-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</div><p className="eyebrow">Welcome back</p><h1>Return to your<br /><em>focus.</em></h1><p className="auth-copy">Sign in to pick up your notes, saved materials, and study rhythm.</p>
        <div className="login-types" role="tablist" aria-label="Account type"><button type="button" className={loginType === "member" ? "active" : ""} onClick={() => setLoginType("member")}><UsersThree size={17} /> Normal user / Uploader</button><button type="button" className={loginType === "admin" ? "active" : ""} onClick={() => setLoginType("admin")}><ShieldCheck size={17} /> Admin</button></div>
        <form className="auth-form" onSubmit={handleLogin}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></label><div className="forgot-row"><Link href="/forgot-password">Forgot password?</Link></div><button className="primary-button auth-submit" disabled={loading}>{loading ? "Signing in..." : <>{loginType === "admin" ? "Enter admin" : "Sign in"} <ArrowRight size={17} /></>}</button>{message && <p className="auth-error">{message}</p>}</form>
        <p className="auth-footer">New to StudyVault? <Link href="/signup">Request access <ArrowRight size={14} /></Link></p><div className="auth-private"><LockKey size={15} /> Your materials stay private.</div>
      </div></section>
    </main>
  );
}
