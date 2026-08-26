"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKey, Sparkle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else if (data.session) router.push("/");
    else setMessage("Check your email to confirm your account.");
    setLoading(false);
  }

  return (
    <main className="auth-shell"><section className="auth-visual"><Link className="auth-brand" href="/"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</Link><div className="auth-quote"><p>“The best notes are the ones you can find when you need them.”</p><span>Private study workspace</span></div><div className="auth-visual-shape" /></section><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</div><Link href="/login" className="back-link auth-back"><ArrowLeft size={15} /> Back to sign in</Link><p className="eyebrow">Join the vault</p><h1>Make room for<br /><em>better study.</em></h1><p className="auth-copy">Create your account. Access is kept private for your study group.</p><form className="auth-form" onSubmit={handleSignup}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Create password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label><button className="primary-button auth-submit" disabled={loading}>{loading ? "Creating account..." : <>Create account <ArrowRight size={17} /></>}</button>{message && <p className="auth-error">{message}</p>}</form><div className="auth-private"><LockKey size={15} /> Your materials stay private.</div></div></section></main>
  );
}
