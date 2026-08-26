"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKey, Sparkle } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabase();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setMessage(error ? error.message : "Check your inbox for a password reset link.");
    setLoading(false);
  }

  return <main className="auth-shell"><section className="auth-visual"><Link className="auth-brand" href="/"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</Link><div className="auth-quote"><p>“A small reset can make room for a better session.”</p><span>Private study workspace</span></div><div className="auth-visual-shape" /></section><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</div><Link href="/login" className="back-link auth-back"><ArrowLeft size={15} /> Back to sign in</Link><p className="eyebrow">Account recovery</p><h1>Set a new<br /><em>password.</em></h1><p className="auth-copy">Enter your account email and we will send you a secure reset link.</p><form className="auth-form" onSubmit={handleSubmit}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><button className="primary-button auth-submit" disabled={loading}>{loading ? "Sending link..." : <>Send reset link <ArrowRight size={17} /></>}</button>{message && <p className="auth-error auth-success">{message}</p>}</form><div className="auth-private"><LockKey size={15} /> Your materials stay private.</div></div></section></main>;
}
