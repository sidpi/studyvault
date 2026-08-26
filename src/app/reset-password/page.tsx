"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKey, Sparkle } from "@phosphor-icons/react";
import { useSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const { supabase } = useSupabase();

  useEffect(() => {
    void supabase.auth.getSession().then((result: { data: { session: unknown } }) => {
      setReady(Boolean(result.data.session));
      if (!result.data.session) setMessage("This reset link is invalid or has expired.");
    });
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated. You can now sign in.");
  }

  return <main className="auth-shell"><section className="auth-panel auth-panel-wide"><div className="auth-form-wrap"><div className="auth-mobile-brand auth-reset-brand"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</div><p className="eyebrow">Account recovery</p><h1>Choose a new<br /><em>password.</em></h1><p className="auth-copy">Use at least 6 characters. You will be able to sign in immediately after saving.</p><form className="auth-form" onSubmit={handleSubmit}><label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label><button className="primary-button auth-submit" disabled={!ready}>Save password <ArrowRight size={17} /></button>{message && <p className={`auth-error ${message.includes("updated") ? "auth-success" : ""}`}>{message}</p>}</form><Link href="/login" className="auth-footer auth-login-link">Return to sign in</Link><div className="auth-private"><LockKey size={15} /> Your materials stay private.</div></div></section></main>;
}
