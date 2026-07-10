import React, { useState, useEffect } from "react";

const sanitize = (str) => str.replace(/<[^>]*>/g, "").trim();

const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30000;
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../lib/supabase";

/* ─────────────────────────────────────────────────────── */
/*  Floating background orbs                               */
/* ─────────────────────────────────────────────────────── */
function Orbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
        top: "-160px", left: "-140px",
        animation: "orbA 16s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(109,40,217,0.11) 0%, transparent 70%)",
        bottom: "-100px", right: "-80px",
        animation: "orbB 20s ease-in-out infinite"
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Input field with focus glow + password toggle          */
/* ─────────────────────────────────────────────────────── */
function Field({ id, label, type = "text", placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === "password";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.3 }}>
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
            padding: isPw ? "11px 40px 11px 14px" : "11px 14px",
            background: focused ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.04)",
            border: focused
              ? "1px solid rgba(139,92,246,0.65)"
              : "1px solid rgba(255,255,255,0.09)",
            borderRadius: 11,
            color: "#e2e8f0",
            fontSize: 14,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.14)" : "none"
          }}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
            style={{
              position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", display: "flex", padding: 2,
              transition: "color 0.2s"
            }}
          >
            {showPw ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Main Auth component                                    */
/* ─────────────────────────────────────────────────────── */
export default function Auth({ onLogin }) {
  const isMobile = useIsMobile();
  const [mode, setMode]   = useState("login"); // "login" | "register" | "forgot"
  const [form, setForm]   = useState({ name: "", email: "", password: "", confirm: "", invite: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [pwStrength, setPwStrength] = useState(0);

  const evalPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { setError("Informe o e-mail cadastrado."); return; }

    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      form.email.trim(),
      { redirectTo: window.location.origin }
    );

    setLoading(false);

    if (resetError) {
      setError("Erro ao enviar e-mail de redefinição. Tente novamente.");
      return;
    }

    setResetSuccess(true);
    setError("");
    setTimeout(() => {
      setResetSuccess(false);
      setMode("login");
      setForm(f => ({ ...f, email: form.email.trim(), password: "" }));
    }, 3000);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (mode === "register" && !form.name.trim()) return "Informe seu nome.";
    if (!form.email.trim())    return "Informe seu e-mail.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(form.email.trim())) return "Formato de e-mail inválido.";
    if (!form.password)        return "Informe sua senha.";
    if (form.password.length < 6) return "A senha deve ter ao menos 6 caracteres.";
    if (mode === "register" && form.password !== form.confirm) return "As senhas não conferem.";
    if (mode === "register" && !form.invite.trim()) return "Informe o código de convite.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Rate limiting check
    if (blockedUntil && new Date() < new Date(blockedUntil)) {
      const remaining = Math.ceil((new Date(blockedUntil) - new Date()) / 1000);
      setError(`Muitas tentativas. Aguarde ${remaining}s para tentar novamente.`);
      return;
    }

    const err = validate();
    if (err) { setError(err); return; }

    // Validar código de convite no cadastro
    if (mode === "register") {
      const code = form.invite.trim().toUpperCase();
      if (!code) { setError("Informe o código de convite."); return; }

      // Verificar no Supabase
      const { data: invite, error: inviteErr } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .maybeSingle();

      console.log("INVITE CHECK →", { code, invite, inviteErr });

      if (inviteErr || !invite) {
        setError("Código de convite inválido ou já utilizado.");
        return;
      }
    }

    setError("");
    setLoading(true);

    if (mode === "register") {
      // Criar conta no Supabase Auth
      const safeName = sanitize(form.name);
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { name: safeName } }
      });

      if (error) {
        setError(error.message === "User already registered"
          ? "Este e-mail já está cadastrado."
          : error.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;

      // Criar perfil
      await supabase.from("profiles").insert({
        id: userId,
        name: safeName
      });

      // Marcar código como usado
      await supabase
        .from("invite_codes")
        .update({ used: true, used_by: userId })
        .eq("code", form.invite.trim().toUpperCase());

      setDone(true);
      setTimeout(() => onLogin({
        id: userId,
        name: safeName,
        email: form.email.trim().toLowerCase(),
        photo: ""
      }), 700);

    } else {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password
      });

      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const until = new Date(Date.now() + BLOCK_DURATION_MS);
          setBlockedUntil(until.toISOString());
          setLoginAttempts(0);
          setError("Muitas tentativas incorretas. Aguarde 30 segundos.");
        } else {
          setError(`E-mail ou senha incorretos. (${MAX_LOGIN_ATTEMPTS - newAttempts} tentativa${MAX_LOGIN_ATTEMPTS - newAttempts !== 1 ? "s" : ""} restante${MAX_LOGIN_ATTEMPTS - newAttempts !== 1 ? "s" : ""})`);
        }
        setLoading(false);
        return;
      }

      // Reset rate limiter on success
      setLoginAttempts(0);
      setBlockedUntil(null);

      const userId = data.user.id;

      // Buscar perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .maybeSingle();

      setDone(true);
      setTimeout(() => onLogin({
        id: userId,
        name: profile?.name || data.user.user_metadata?.name || "Usuário",
        email: data.user.email,
        photo: data.user.user_metadata?.photo || ""
      }), 700);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setPwStrength(0);
    setForm({ name: "", email: "", password: "", confirm: "", invite: "" });
  };

  const demoFill = () => {
    setMode("login");
    setForm((f) => ({ ...f, email: "demo@rynance.com", password: "demo123" }));
    setError("");
  };

  return (
    <>
      <style>{`
        @keyframes orbA {
          0%,100%{transform:translate(0,0) scale(1);}
          33%{transform:translate(28px,-18px) scale(1.04);}
          66%{transform:translate(-12px,22px) scale(0.97);}
        }
        @keyframes orbB {
          0%,100%{transform:translate(0,0) scale(1);}
          40%{transform:translate(-22px,14px) scale(1.03);}
          70%{transform:translate(18px,-28px) scale(0.96);}
        }
        @keyframes slideUp {
          from{opacity:0;transform:translateY(28px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes spinIcon {
          to{transform:rotate(360deg);}
        }
        @keyframes pulseRing {
          0%,100%{transform:scale(0.88);opacity:.6;}
          50%{transform:scale(1.12);opacity:.25;}
        }
        .ryn-auth-submit {
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1) !important;
        }
        .ryn-auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(139,92,246,0.48) !important;
        }
        .ryn-auth-submit:active:not(:disabled) { transform: translateY(0); }
        .ryn-demo-btn:hover {
          background: rgba(139,92,246,0.12) !important;
          border-color: rgba(139,92,246,0.45) !important;
          color: #A78BFA !important;
        }
        .ryn-switch-link {
          color: #8B5CF6; cursor: pointer; font-weight: 700;
          background: none; border: none; font-size: 14px;
          padding: 0; font-family: inherit;
          transition: color 0.18s;
        }
        .ryn-switch-link:hover { color: #A78BFA; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "24px 16px"
      }}>
        <Orbs />

        <div style={{
          position: "relative", zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          width: "100%",
          maxWidth: 420
        }}>

          {/* ══ FORM PANEL ══ */}
          <div style={{
            width: "100%",
            background: "rgba(19,13,46,0.80)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(139,92,246,0.20)",
            borderRadius: 24,
            padding: isMobile ? "32px 20px" : "42px 38px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03)",
            animation: "slideUp 0.65s cubic-bezier(0.16,1,0.3,1) both"
          }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 34 }}>
              <div style={{ position: "relative", display: "flex" }}>
                <div style={{
                  position: "absolute", inset: -7, borderRadius: "50%",
                  background: "rgba(139,92,246,0.18)",
                  animation: "pulseRing 3s ease-in-out infinite"
                }} />
                <svg width="38" height="38" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <linearGradient id="ag" x1="10%" y1="0%" x2="90%" y2="100%">
                      <stop offset="0%" stopColor="#A78BFA"/>
                      <stop offset="100%" stopColor="#6D28D9"/>
                    </linearGradient>
                  </defs>
                  <path d="M18 18 L18 82" stroke="url(#ag)" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="url(#ag)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M36 58 L72 82" stroke="url(#ag)" strokeWidth="12" strokeLinecap="round"/>
                  <line x1="20" y1="92" x2="20" y2="82" stroke="url(#ag)" strokeWidth="7" strokeLinecap="round"/>
                  <line x1="34" y1="92" x2="34" y2="76" stroke="url(#ag)" strokeWidth="7" strokeLinecap="round"/>
                  <line x1="48" y1="92" x2="48" y2="68" stroke="url(#ag)" strokeWidth="7" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{
                  fontSize: 24, fontWeight: 800, letterSpacing: -0.6,
                  background: "linear-gradient(135deg,#8B5CF6,#6D28D9)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>Rynance</div>
                <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 0.4 }}>controle financeiro pessoal</div>
              </div>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.4, margin: "0 0 6px" }}>
                {mode === "login" ? "Bem-vindo de volta 👋" : mode === "register" ? "Criar conta grátis" : "Redefinir senha 🔑"}
              </h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                {mode === "login"
                  ? "Entre na sua conta para acessar o painel."
                  : mode === "register"
                  ? "Comece a organizar suas finanças hoje."
                  : "Informe o e-mail da sua conta"}
              </p>
            </div>

            {/* Form — Login / Register */}
            {mode !== "forgot" && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === "register" && (
                <Field id="auth-name" label="Nome completo" placeholder="Seu nome" value={form.name} onChange={set("name")} />
              )}
              <Field id="auth-email" label="E-mail" type="email" placeholder="voce@email.com" value={form.email} onChange={set("email")} />
              <Field id="auth-pw" label="Senha" type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => { set("password")(e); if (mode === "register") setPwStrength(evalPasswordStrength(e.target.value)); }} />

              {/* Password strength indicator — register only */}
              {mode === "register" && form.password.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "-8px", alignItems: "center" }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: "3px", borderRadius: "2px",
                      backgroundColor: pwStrength >= i
                        ? (pwStrength <= 1 ? "#ef4444" : pwStrength <= 2 ? "#fb923c" : pwStrength <= 3 ? "#eab308" : "#22c55e")
                        : "rgba(255,255,255,0.1)"
                    }} />
                  ))}
                  <span style={{ fontSize: "10px", color: "#64748b", marginLeft: "6px", whiteSpace: "nowrap" }}>
                    {["", "Fraca", "Razoável", "Boa", "Forte"][pwStrength]}
                  </span>
                </div>
              )}

              {mode === "register" && (
                <Field id="auth-confirm" label="Confirmar senha" type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
              )}
              {mode === "register" && (
                <Field
                  id="invite"
                  label="Código de Convite"
                  placeholder="BETA-RYNX-0000"
                  value={form.invite}
                  onChange={set("invite")}
                />
              )}

              {/* Error */}
              {error && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(248,113,113,0.09)",
                  border: "1px solid rgba(248,113,113,0.28)",
                  borderRadius: 10, fontSize: 13, color: "#f87171", fontWeight: 500
                }}>
                  {error}
                </div>
              )}

              {/* Reset success message */}
              {resetSuccess && (
                <div style={{
                  backgroundColor: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#22c55e",
                  fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "8px"
                }}>
                  <span>✓</span>
                  <span>Senha redefinida com sucesso! Redirecionando para login...</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || done}
                className="ryn-auth-submit"
                style={{
                  marginTop: 6, padding: "13px 0",
                  borderRadius: 13, border: "none",
                  cursor: loading || done ? "default" : "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 15, fontWeight: 700, color: "#fff",
                  background: done
                    ? "linear-gradient(135deg,#22c55e,#16a34a)"
                    : loading
                    ? "rgba(139,92,246,0.45)"
                    : "linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%)",
                  boxShadow: done || loading ? "none" : "0 4px 18px rgba(139,92,246,0.38)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}
              >
                {done ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Entrando…
                  </>
                ) : loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ animation: "spinIcon 0.9s linear infinite" }}>
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                    Aguarde…
                  </>
                ) : mode === "login" ? "Entrar na conta" : "Criar minha conta"}
              </button>

              {/* Forgot password link — login only */}
              {mode === "login" && (
                <div style={{ textAlign: "center", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(""); setForm(f => ({ ...f, password: "" })); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "12px", color: "#64748b",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px"
                    }}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
            </form>
            )}

            {/* Form — Forgot Password */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔑</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px" }}>
                    Redefinir senha
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    Enviaremos um link de redefinição para seu e-mail
                  </div>
                </div>

                <Field
                  id="email-forgot"
                  label="E-mail cadastrado"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={set("email")}
                />

                {/* Error */}
                {error && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(248,113,113,0.09)",
                    border: "1px solid rgba(248,113,113,0.28)",
                    borderRadius: 10, fontSize: 13, color: "#f87171", fontWeight: 500
                  }}>
                    {error}
                  </div>
                )}

                {/* Reset success */}
                {resetSuccess && (
                  <div style={{
                    backgroundColor: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#22c55e",
                    fontWeight: 500,
                    display: "flex", alignItems: "center", gap: "8px"
                  }}>
                    <span>✓</span>
                    <span>E-mail de redefinição enviado! Verifique sua caixa de entrada.</span>
                  </div>
                )}

                <button type="submit"
                  disabled={loading}
                  className="ryn-auth-submit"
                  style={{
                    padding: "13px", background: loading ? "rgba(139,92,246,0.45)" : "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px",
                    fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: loading ? "none" : "0 4px 16px rgba(109,40,217,0.4)"
                  }}>
                  {loading ? "Enviando..." : "Redefinir Senha"}
                </button>

                <button type="button"
                  onClick={() => { setMode("login"); setError(""); setResetSuccess(false); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "13px", color: "#64748b",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: "center"
                  }}>
                  ← Voltar para o login
                </button>
              </form>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Demo button */}
            <button
              type="button"
              onClick={demoFill}
              className="ryn-demo-btn"
              style={{
                width: "100%", padding: "11px 0",
                borderRadius: 13, cursor: "pointer",
                border: "1px solid rgba(139,92,246,0.22)",
                background: "rgba(139,92,246,0.06)",
                color: "#8B5CF6", fontSize: 14, fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Acessar conta demo
            </button>

            {/* Switch mode */}
            {mode !== "forgot" && (
            <p style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "#64748b" }}>
              {mode === "login" ? "Não tem uma conta? " : "Já tem uma conta? "}
              <button className="ryn-switch-link" onClick={switchMode} type="button">
                {mode === "login" ? "Cadastre-se" : "Fazer login"}
              </button>
            </p>
            )}
          </div>

          <p style={{
            textAlign: "center", fontSize: 12, color: "#64748b", lineHeight: 1.6,
            marginTop: 8
          }}>
            <strong style={{ color: "#8B5CF6" }}>Seus dados ficam salvos localmente.</strong> Sem servidores ou cookies de terceiros. 🔒
          </p>
        </div>
      </div>
    </>
  );
}
