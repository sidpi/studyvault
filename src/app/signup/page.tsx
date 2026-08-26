"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKey, Sparkle } from "@phosphor-icons/react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json() as { error?: string; message?: string };
    setMessage(response.ok ? (result.message ?? "Request sent.") : (result.error ?? "Unable to send request."));
    if (response.ok) {
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell"><section className="auth-visual"><Link className="auth-brand" href="/"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</Link><div className="auth-quote"><p>“The best notes are the ones you can find when you need them.”</p><span>Private study workspace</span></div><div className="auth-visual-shape" /></section><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><Sparkle size={18} weight="fill" /></span>StudyVault</div><Link href="/login" className="back-link auth-back"><ArrowLeft size={15} /> Back to sign in</Link><p className="eyebrow">Request access</p><h1>Ask to join<br /><em>the vault.</em></h1><p className="auth-copy">Your request goes to Super Admin review. Access is private by approval only.</p><form className="auth-form" onSubmit={handleSignup}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Create password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} required /></label><button className="primary-button auth-submit" disabled={loading}>{loading ? "Sending request..." : <>Send request <ArrowRight size={17} /></>}</button>{message && <p className={`auth-error ${message.includes("Request sent") ? "auth-success" : ""}`}>{message}</p>}</form><div className="auth-private"><LockKey size={15} /> Your materials stay private.</div></div></section></main>
  );
}
