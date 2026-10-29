import React, { useState, useEffect, useRef } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../lib/supabase";

const sanitize = (str) => str.replace(/<[^>]*>/g, "").trim();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30000;

/* ── Scroll Reveal Hook ──────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── 3D tilt on mouse ────────────────────────────────────── */
function useTilt(strength = 12) {
  const ref = useRef(null);
  const handle = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)"; };
  return { ref, onMouseMove: handle, onMouseLeave: reset };
}

/* ── Field ───────────────────────────────────────────────── */
function Field({ id, label, type = "text", placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === "password";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={isPw && showPw ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={isPw ? "current-password" : type === "email" ? "email" : "name"}
          style={{
            width: "100%",
            padding: isPw ? "12px 42px 12px 16px" : "12px 16px",
            background: focused ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${focused ? "rgba(139,92,246,0.7)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: 12,
            color: "#fff",
            fontSize: 15,
            fontFamily: "inherit",
            outline: "none",
            transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.12)" : "none"
          }}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", padding: 2, transition: "color 0.2s" }}>
            {showPw
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

/* ── App Mock Preview ────────────────────────────────────── */
function AppMockup() {
  const tilt = useTilt(8);
  return (
    <div style={{ position: "relative", flex: 1, display: "flex", justifyContent: "center" }}>

      {/* Floating chip 1 — Saldo */}
      <div style={{
        position: "absolute", top: "8%", left: "-2%", zIndex: 4,
        padding: "10px 16px 10px 12px",
        background: "rgba(26,26,34,0.86)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        animation: "chipFloat1 5.4s ease-in-out infinite",
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.04em" }}>SALDO ATUAL</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>R$ 1.650,00</div>
        </div>
      </div>

      {/* Floating chip 2 — Conta paga */}
      <div style={{
        position: "absolute", bottom: "22%", left: "-8%", zIndex: 4,
        padding: "10px 16px 10px 12px",
        background: "rgba(26,26,34,0.86)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        animation: "chipFloat2 6.2s ease-in-out infinite 0.8s",
      }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6.5 9.2 17.3 4 12.1"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Aluguel pago</div>
          <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>R$ 1.200,00 ✓</div>
        </div>
      </div>

      {/* Floating chip 3 — Orçamento */}
      <div style={{
        position: "absolute", top: "42%", right: "-6%", zIndex: 4,
        padding: "10px 16px 10px 12px",
        background: "rgba(26,26,34,0.86)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        animation: "chipFloat3 4.8s ease-in-out infinite 1.4s",
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.04em" }}>ORÇAMENTO</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>70% utilizado</div>
        </div>
      </div>

      {/* Main phone mockup */}
      <div
        {...tilt}
        style={{
          width: "min(300px, 80vw)",
          borderRadius: 40,
          padding: 8,
          background: "#000",
          boxShadow: "0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07)",
          transition: "transform 0.55s cubic-bezier(.34,1.4,.64,1)",
          position: "relative", zIndex: 3,
        }}
      >
        {/* Screen */}
        <div style={{ borderRadius: 33, overflow: "hidden", background: "#0b0514", padding: "16px 14px 0" }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>R</div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Olá,</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Setembro 2026</div>
            </div>
          </div>

          {/* Balance */}
          <div style={{ marginBottom: 4, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em" }}>SALDO EFETIVO</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e", letterSpacing: "-1px", marginBottom: 14, fontVariantNumeric: "tabular-nums" }}>R$ 1.650</div>

          {/* Flow bar */}
          <div style={{ display: "flex", gap: 3, height: 7, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.06)", marginBottom: 14 }}>
            <div style={{ width: "43%", background: "#22c55e", borderRadius: 999 }}/>
            <div style={{ width: "28%", background: "#ef4444", borderRadius: 999 }}/>
            <div style={{ width: "15%", background: "#a78bfa", borderRadius: 999 }}/>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[["RECEITAS", "R$ 3.840", "#22c55e"], ["DESPESAS", "R$ 2.190", "#ef4444"], ["CARTÕES", "R$ 480", "#a78bfa"]].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Transactions */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden", marginBottom: 0 }}>
            <div style={{ padding: "8px 12px", fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em" }}>LANÇAMENTOS</div>
            {[
              [<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, "Supermercado", "Hoje", "-R$ 320", "#ef4444"],
              [<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><line x1="3" y1="22" x2="15" y2="22"/><path d="M15 12h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V10l-4-4"/></svg>, "Combustível", "Ontem", "-R$ 180", "#ef4444"],
              [<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>, "Salário", "01/09", "+R$ 3.840", "#22c55e"],
            ].map(([ic, label, date, val, c]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{ic}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{date}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 8px 16px", marginTop: 2 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.05)", borderRadius: 22, padding: 5 }}>
              {[
                ["M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-5 0v-15A2.5 2.5 0 0 1 9.5 2zM14.5 7A2.5 2.5 0 0 1 17 9.5v10a2.5 2.5 0 0 1-5 0v-10A2.5 2.5 0 0 1 14.5 7z", true],
                ["M2 5h20M2 10h20M2 15h14", false],
                ["M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", false],
                ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", false],
              ].map(([d, active], i) => (
                <div key={i} style={{
                  flex: active ? 3 : 1, height: 36, borderRadius: 18,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  <svg width={active ? 16 : 18} height={active ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke={active ? "#a78bfa" : "rgba(255,255,255,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={d}/>
                  </svg>
                  {active && <span style={{ fontSize: 10, fontWeight: 600, color: "#a78bfa" }}>Início</span>}
                </div>
              ))}
            </div>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feature Section ─────────────────────────────────────── */
function FeatureSection({ icon, accent, num, title, lead, children }) {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} style={{
      padding: "88px 24px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Accent glow */}
      <div style={{
        position: "absolute", left: "50%", top: "56%",
        width: "min(700px, 94vw)", height: 400,
        transform: "translate(-50%,-50%)",
        borderRadius: "50%",
        background: `radial-gradient(closest-side, ${accent}, transparent 72%)`,
        pointerEvents: "none",
        opacity: visible ? 0.07 : 0,
        transition: "opacity 1.4s ease",
      }}/>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Label */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{num}.</span>
          <span style={{ color: accent, fontSize: 16 }}>{icon}</span>
          <span>{title}</span>
        </div>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.12, marginBottom: 12, color: "#fff" }}>{lead}</h2>
        <div style={{
          width: "100%", maxWidth: 560,
          background: "rgba(26,26,34,0.7)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
          overflow: "hidden",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(.22,1,.36,1)",
          textAlign: "left",
          marginTop: 28,
        }}>
          {children}
        </div>
      </div>
    </section>
  );
}

/* ── Proof Card ──────────────────────────────────────────── */
function ProofCard({ icon, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 4,
        transition: "all 0.3s cubic-bezier(.34,1.4,.64,1)",
        transform: hov ? "translateY(-3px)" : "none",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6, display: "inline-block", transform: hov ? "scale(1.18) rotate(-7deg)" : "none", transition: "transform 0.35s cubic-bezier(.34,1.4,.64,1)" }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f6" }}>{title}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

/* ── Main Auth ───────────────────────────────────────────── */
export default function Auth({ onLogin }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [pwStrength, setPwStrength] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setShowMobileBar(r.bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const evalPwStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { setError("Informe o e-mail cadastrado."); return; }
    setError(""); setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: window.location.origin });
    setLoading(false);
    if (resetError) { setError("Erro ao enviar e-mail. Tente novamente."); return; }
    setResetSuccess(true);
    setTimeout(() => { setResetSuccess(false); setMode("login"); setForm(f => ({ ...f, email: form.email.trim(), password: "" })); }, 3000);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (mode === "register" && !form.name.trim()) return "Informe seu nome.";
    if (!form.email.trim()) return "Informe seu e-mail.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return "E-mail inválido.";
    if (!form.password) return "Informe sua senha.";
    if (form.password.length < 6) return "Senha com ao menos 6 caracteres.";
    if (mode === "register" && form.password !== form.confirm) return "As senhas não conferem.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blockedUntil && new Date() < new Date(blockedUntil)) {
      const remaining = Math.ceil((new Date(blockedUntil) - new Date()) / 1000);
      setError(`Muitas tentativas. Aguarde ${remaining}s.`); return;
    }
    const err = validate();
    if (err) { setError(err); return; }

    setError(""); setLoading(true);

    if (mode === "register") {
      const safeName = sanitize(form.name);
      const { data, error } = await supabase.auth.signUp({ email: form.email.trim().toLowerCase(), password: form.password, options: { data: { name: safeName } } });
      if (error) { setError(error.message === "User already registered" ? "E-mail já cadastrado." : error.message); setLoading(false); return; }
      const userId = data.user?.id;
      await supabase.from("profiles").insert({ id: userId, name: safeName });
      setDone(true);
      setTimeout(() => onLogin({ id: userId, name: safeName, email: form.email.trim().toLowerCase(), photo: "" }), 700);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) {
        const n = loginAttempts + 1; setLoginAttempts(n);
        if (n >= MAX_LOGIN_ATTEMPTS) { setBlockedUntil(new Date(Date.now() + BLOCK_DURATION_MS).toISOString()); setLoginAttempts(0); setError("Muitas tentativas. Aguarde 30s."); }
        else setError(`E-mail ou senha incorretos. (${MAX_LOGIN_ATTEMPTS - n} tentativa${MAX_LOGIN_ATTEMPTS - n !== 1 ? "s" : ""} restante${MAX_LOGIN_ATTEMPTS - n !== 1 ? "s" : ""})`);
        setLoading(false); return;
      }
      setLoginAttempts(0); setBlockedUntil(null);
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", data.user.id).maybeSingle();
      setDone(true);
      setTimeout(() => onLogin({ id: data.user.id, name: profile?.name || data.user.user_metadata?.name || "Usuário", email: data.user.email, photo: data.user.user_metadata?.photo || "" }), 700);
    }
  };

  const scrollToForm = (targetMode) => {
    setMode(targetMode);
    document.getElementById("auth-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const words = ["Controle", "suas", "finanças", "com", "clareza."];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0b0514; color: #f4f4f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; line-height: 1.5; }
        ::selection { background: rgba(139,92,246,0.32); }

        @keyframes chipFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes chipFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes chipFloat3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes wordIn { from{opacity:0;filter:blur(8px);transform:translateY(14px)} to{opacity:1;filter:blur(0);transform:none} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes sheen { 0%{left:-40%} 42%{left:110%} 100%{left:110%} }

        .pill-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 46px; padding: 12px 24px; border: 0; border-radius: 999px;
          font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: transform 0.18s cubic-bezier(.34,1.4,.64,1), box-shadow 0.22s ease;
          white-space: nowrap;
        }
        .pill-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(0,0,0,0.45); }
        .pill-btn:active { transform: scale(0.97); }
        .pill-primary { background: #f4f4f6; color: #0b0b0d; }
        .pill-ghost { background: rgba(255,255,255,0.07); color: #f4f4f6; border: 1px solid rgba(255,255,255,0.1); }

        .submit-btn {
          width: 100%; padding: 14px; border-radius: 999px; border: none; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: 700; color: #fff;
          transition: all 0.22s cubic-bezier(.34,1.4,.64,1);
          position: relative; overflow: hidden;
        }
        .submit-btn::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 34%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.18), transparent);
          animation: sheen 5.6s ease-in-out infinite 1.6s;
          left: -40%;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(139,92,246,0.5); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }

        .tab-btn { background: none; border: none; color: rgba(255,255,255,0.35); font-family: inherit; font-size: 14px; font-weight: 600; padding: 12px 0; cursor: pointer; transition: color 0.2s; position: relative; flex: 1; }
        .tab-btn.active { color: #fff; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #8B5CF6; border-radius: 2px 2px 0 0; }

        .feature-item { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s ease; }
        .feature-item:last-child { border-bottom: none; }
        .feature-item:hover { background: rgba(255,255,255,0.03); }
        .feature-icon { width: 38px; height: 38px; border-radius: 11px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; transition: transform 0.35s cubic-bezier(.34,1.4,.64,1); }
        .feature-item:hover .feature-icon { transform: scale(1.12) rotate(-6deg); }
      `}</style>

      {/* ── Sticky Nav ──────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 60,
        background: "rgba(11,5,20,0.78)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 66, gap: 12 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", flex: 1 }}>
            <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
              <defs><linearGradient id="navG" x1="10%" y1="0%" x2="90%" y2="100%"><stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#6D28D9"/></linearGradient></defs>
              <path d="M18 18 L18 82" stroke="url(#navG)" strokeWidth="12" strokeLinecap="round"/>
              <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="url(#navG)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M36 58 L72 82" stroke="url(#navG)" strokeWidth="12" strokeLinecap="round"/>
            </svg>
            <span style={{ background: "linear-gradient(135deg, #A78BFA, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rynance</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => scrollToForm("login")} className="pill-btn pill-ghost" style={{ minHeight: 38, padding: "8px 18px", fontSize: 14 }}>Entrar</button>
            <button onClick={() => scrollToForm("register")} className="pill-btn pill-primary" style={{ minHeight: 38, padding: "8px 18px", fontSize: 14 }}>Criar conta</button>
          </div>
        </div>
      </nav>

      <div style={{ position: "relative", width: "100%" }}>

        {/* Background orbs */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(139,92,246,0.10), transparent 70%)", top: "-200px", left: "-200px" }}/>
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(109,40,217,0.08), transparent 70%)", bottom: "-100px", right: "-80px" }}/>
        </div>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section ref={heroRef} style={{ padding: isMobile ? "80px 24px 60px" : "60px 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,400px) minmax(0,1fr)", gap: isMobile ? 60 : 64, alignItems: "center" }}>
            
            {/* Left: Text */}
            <div>
              {/* Beta badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "5px 14px", borderRadius: 999,
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
                marginBottom: 24,
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeUp 0.6s ease 0.1s both" : "none",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}/>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Beta aberto — 100% gratuito</span>
              </div>

              {/* Headline — word by word animation */}
              <h1 style={{ fontSize: isMobile ? 38 : "clamp(32px,3.8vw,48px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 20 }}>
                {words.map((w, i) => (
                  <span key={i} className="pal" style={{
                    display: "inline-block",
                    marginRight: "0.25em",
                    color: w === "finanças" ? "transparent" : "#fff",
                    background: w === "finanças" ? "linear-gradient(135deg, #a78bfa, #8b5cf6)" : "none",
                    WebkitBackgroundClip: w === "finanças" ? "text" : "unset",
                    backgroundClip: w === "finanças" ? "text" : "unset",
                    opacity: heroVisible ? 1 : 0,
                    filter: heroVisible ? "blur(0)" : "blur(7px)",
                    transform: heroVisible ? "none" : "translateY(14px)",
                    transition: `opacity 0.65s ease ${0.1 + i * 0.07}s, filter 0.65s ease ${0.1 + i * 0.07}s, transform 0.65s cubic-bezier(.22,1,.36,1) ${0.1 + i * 0.07}s`,
                  }}>{w}{w !== "clareza." && w !== "finanças" ? "" : ""} </span>
                ))}
              </h1>

              <p style={{
                fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 32, maxWidth: 400,
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeUp 0.6s ease 0.55s both" : "none",
              }}>
                Receitas, despesas e cartões num só lugar. Importe OFX, defina orçamentos e veja para onde vai seu dinheiro.
              </p>

              <div style={{
                display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row", marginBottom: 40,
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeUp 0.6s ease 0.7s both" : "none",
              }}>
                <button onClick={() => scrollToForm("register")} className="pill-btn pill-primary" style={{ fontSize: 16, padding: "14px 30px" }}>
                  Começar agora — grátis
                </button>
                <button onClick={() => scrollToForm("login")} className="pill-btn pill-ghost" style={{ fontSize: 16, padding: "14px 30px" }}>
                  Já tenho conta
                </button>
              </div>

              {/* Stats */}
              <div style={{
                display: "flex", gap: 28, flexWrap: "wrap",
                opacity: heroVisible ? 1 : 0,
                animation: heroVisible ? "fadeUp 0.6s ease 0.85s both" : "none",
              }}>
                {[["100%", "Gratuito"], ["OFX", "Importação"], ["PDF", "Relatórios"], ["Dark", "Modo escuro"]].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em" }}>{v}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginTop: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: App Mockup */}
            {!isMobile && <AppMockup />}
          </div>
        </section>

        {/* ── Proof cards ──────────────────────────────────── */}
        <section style={{ padding: "0 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
            <ProofCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>} title="Sem conectar seu banco" desc="Seus dados ficam com você. Nenhuma credencial bancária é solicitada ou armazenada." />
            <ProofCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} title="Pronto em 1 minuto" desc="Importe seu OFX ou adicione manualmente. Sem onboarding complicado." />
            <ProofCard icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>} title="Interface que você vai amar" desc="Dark mode nativo, animações suaves e design premium no seu controle financeiro." />
          </div>
        </section>

        {/* ── Feature sections ─────────────────────────────── */}
        <FeatureSection icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>} accent="rgba(139,92,246,0.8)" num="1" title="Dashboard" lead="Tudo o que importa numa só tela.">
          <div style={{ padding: "20px 20px 4px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>SETEMBRO 2026</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#22c55e", letterSpacing: "-0.04em", marginBottom: 12, fontVariantNumeric: "tabular-nums" }}>R$ 1.650,00</div>
            <div style={{ display: "flex", gap: 3, height: 7, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.06)", marginBottom: 16 }}>
              <div style={{ width: "43%", background: "#22c55e", borderRadius: 999 }}/><div style={{ width: "28%", background: "#ef4444", borderRadius: 999 }}/><div style={{ width: "12%", background: "#a78bfa", borderRadius: 999 }}/>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, paddingBottom: 20 }}>
              {[["Receitas", "R$ 3.840", "#22c55e"], ["Despesas", "R$ 2.190", "#ef4444"], ["Saldo", "R$ 1.650", "#a78bfa"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </FeatureSection>

        <FeatureSection icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} accent="rgba(16,185,129,0.8)" num="2" title="Importação OFX" lead="Não digite nada. Importe em segundos.">
          <div className="feature-item"><div className="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg></div><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>Suporte a todos os bancos</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Itaú, Nubank, Bradesco, Santander e mais</div></div></div>
          <div className="feature-item"><div className="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></div><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>Conciliação automática</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Detecta duplicatas e organiza por categoria</div></div></div>
          <div className="feature-item"><div className="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>Navegação por período</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Avance ou volte meses com um clique</div></div></div>
        </FeatureSection>

        <FeatureSection icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} accent="rgba(59,130,246,0.8)" num="3" title="Cartões" lead="Controle total das suas faturas.">
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Nubank", "#8a2be2", "Platinum", "•••• 4521", "68%"],["Itaú", "#e87722", "Gold", "•••• 9834", "38%"]].map(([bank, color, tier, num, pct]) => (
              <div key={bank} style={{ borderRadius: 14, padding: "16px 18px", background: `linear-gradient(135deg, ${color}cc, ${color}88)`, position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{bank}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.16)", padding: "2px 8px", borderRadius: 999 }}>{tier}</div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", marginBottom: 10 }}>{num}</div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: pct, height: "100%", background: "#fff", borderRadius: 999 }}/>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 5 }}>{pct} do limite utilizado</div>
              </div>
            ))}
          </div>
        </FeatureSection>

        <FeatureSection icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} accent="rgba(251,146,60,0.8)" num="4" title="Orçamentos" lead="Defina limites. Receba alertas.">
          <div>
            {[[<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, "Alimentação", 850, 1200, "#22c55e"], [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>, "Transporte", 420, 500, "#f97316"], [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>, "Lazer", 310, 300, "#ef4444"]].map(([ic, cat, spent, budget, color]) => (
              <div key={cat} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{ic}</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{cat}</span>
                  </div>
                  <span style={{ fontSize: 13, color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>R$ {spent} / {budget}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (spent/budget)*100)}%`, height: "100%", background: color, borderRadius: 999 }}/>
                </div>
              </div>
            ))}
          </div>
        </FeatureSection>

        {/* ── Form Section ─────────────────────────────────── */}
        <section id="auth-form-section" style={{ padding: "80px 24px 100px", position: "relative", zIndex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "100%", maxWidth: 420,
            background: "rgba(18,10,38,0.75)",
            backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(139,92,246,0.12)",
            borderRadius: 24,
            padding: isMobile ? "28px 20px" : "36px 32px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}>
            {mode !== "forgot" ? (
              <>
                <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 28 }}>
                  <button className={`tab-btn ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Entrar</button>
                  <button className={`tab-btn ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>Criar conta</button>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
                    {mode === "login" ? "Bem-vindo de volta" : "Junte-se ao Beta"}
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                    {mode === "login" ? "Insira suas credenciais para acessar." : "Preencha os dados abaixo para começar."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {mode === "register" && <Field id="auth-name" label="Nome completo" placeholder="Seu nome" value={form.name} onChange={set("name")} />}
                  <Field id="auth-email" label="E-mail" type="email" placeholder="voce@email.com" value={form.email} onChange={set("email")} />
                  <Field id="auth-pw" label="Senha" type="password" placeholder="••••••••" value={form.password}
                    onChange={(e) => { set("password")(e); if (mode === "register") setPwStrength(evalPwStrength(e.target.value)); }} />

                  {mode === "register" && form.password.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: -8 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, transition: "background 0.3s",
                          background: pwStrength >= i ? (pwStrength <= 1 ? "#ef4444" : pwStrength <= 2 ? "#f97316" : pwStrength <= 3 ? "#eab308" : "#22c55e") : "rgba(255,255,255,0.08)" }}/>
                      ))}
                    </div>
                  )}

                  {mode === "register" && (
                    <Field id="auth-confirm" label="Confirmar senha" type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
                  )}

                  {error && (
                    <div style={{ padding: "11px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, fontSize: 13, color: "#f87171", fontWeight: 500 }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading || done} className="submit-btn" style={{
                    marginTop: 6,
                    background: done ? "linear-gradient(135deg,#22c55e,#16a34a)" : loading ? "rgba(139,92,246,0.4)" : "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    boxShadow: done || loading ? "none" : "0 0 24px rgba(139,92,246,0.4)",
                  }}>
                    {loading ? "Aguarde..." : done ? "✓ Sucesso!" : mode === "login" ? "Entrar na conta" : "Criar minha conta"}
                  </button>

                  {mode === "login" && (
                    <div style={{ textAlign: "center", marginTop: 4 }}>
                      <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>
                        Esqueceu sua senha?
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Redefinir senha</h2>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Enviaremos um link para o seu e-mail.</p>
                </div>
                <Field id="email-forgot" label="E-mail cadastrado" type="email" placeholder="seu@email.com" value={form.email} onChange={set("email")} />
                {error && <div style={{ padding: "11px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, fontSize: 13, color: "#f87171" }}>{error}</div>}
                {resetSuccess && <div style={{ padding: "11px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, fontSize: 13, color: "#22c55e" }}>E-mail enviado! Verifique sua caixa.</div>}
                <button type="submit" disabled={loading} className="submit-btn" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </button>
                <button type="button" onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>← Voltar para o login</button>
              </form>
            )}

            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.6, marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <strong style={{ color: "rgba(139,92,246,0.8)" }}>Privacidade em primeiro lugar.</strong><br/>
              Sem servidores de terceiros. Sem rastreamento.
            </p>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 24px 40px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
                <path d="M18 18 L18 82" stroke="#8B5CF6" strokeWidth="12" strokeLinecap="round"/>
                <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="#8B5CF6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M36 58 L72 82" stroke="#8B5CF6" strokeWidth="12" strokeLinecap="round"/>
              </svg>
              Rynance
            </div>
            <span>·</span>
            <span>© {new Date().getFullYear()} Ryn Dev</span>
            <span>·</span>
            <span>Desenvolvido com <span style={{ color: "#a78bfa" }}>♥</span></span>
            <span>·</span>
            <span>Controle financeiro pessoal</span>
          </div>
        </footer>

        {/* ── Mobile sticky CTA ────────────────────────────── */}
        {isMobile && (
          <div style={{
            position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 70,
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px 10px 18px",
            borderRadius: 999,
            background: "rgba(26,20,40,0.92)",
            backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
            boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            transform: showMobileBar ? "translateY(0)" : "translateY(120%)",
            transition: "transform 0.42s cubic-bezier(.34,1.4,.64,1)",
          }}>
            <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Pronto para começar?</span>
            <button onClick={() => scrollToForm("register")} className="pill-btn pill-primary" style={{ minHeight: 38, padding: "8px 18px", fontSize: 14 }}>
              Criar conta
            </button>
          </div>
        )}
      </div>
    </>
  );
}
