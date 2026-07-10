import React, { useState, useEffect } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { demoTransactions } from "../data/demoData";
import { supabase } from "../lib/supabase";

const PRESET_GRADIENTS = {
  "preset:purple": "linear-gradient(135deg, #a78bfa, #6d28d9)",
  "preset:blue": "linear-gradient(135deg, #60a5fa, #2563eb)",
  "preset:emerald": "linear-gradient(135deg, #34d399, #059669)",
  "preset:sunset": "linear-gradient(135deg, #fca5a5, #b91c1c)",
  "preset:coral": "linear-gradient(135deg, #f472b6, #db2777)"
};

export default function Settings({
  transactions,
  setTransactions,
  budgets,
  setBudgets,
  user,
  updateUser,
  darkMode,
  setDarkMode
}) {
  const isMobile = useIsMobile();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [profileName, setProfileName] = useState(user ? user.name : "");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
    }
  }, [user]);

  const showSuccess = (msg) => {
    setExportMsg(msg);
    setTimeout(() => setExportMsg(""), 3500);
  };

  const handleNameSave = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert("O nome não pode ser vazio.");
      return;
    }
    if (updateUser) {
      updateUser({ name: profileName.trim() });
      showSuccess("Nome de perfil atualizado com sucesso!");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");

    if (!pwForm.current) { setPwError("Informe a senha atual."); return; }
    if (!pwForm.next)    { setPwError("Informe a nova senha."); return; }
    if (pwForm.next.length < 6) { setPwError("A nova senha deve ter ao menos 6 caracteres."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("As senhas não conferem."); return; }

    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwForm.current
      });
      if (signInErr) {
        setPwError("Senha atual incorreta.");
        return;
      }

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: pwForm.next
      });
      if (updateErr) {
        setPwError("Erro ao atualizar senha.");
        return;
      }

      setPwForm({ current: "", next: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwError("Erro ao atualizar senha.");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 128;
        canvas.height = 128;

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        if (updateUser) {
          updateUser({ photo: dataUrl });
          showSuccess("Foto de perfil atualizada!");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetDemo = () => {
    setTransactions(demoTransactions);
    setConfirmReset(false);
    showSuccess("Dados de demonstração restaurados com sucesso!");
  };

  const handleClearAll = () => {
    setTransactions([]);
    setBudgets({});
    setConfirmClear(false);
    showSuccess("Todos os dados foram apagados.");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Tipo", "Valor", "Categoria", "Descrição", "Data", "Status"];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.type === "income" ? "Receita" : "Despesa",
      Number(tx.amount).toFixed(2).replace(".", ","),
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.date,
      tx.status === "paid"
        ? tx.type === "income"
          ? "Recebido"
          : "Pago"
        : "Pendente"
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rynance_lancamentos_${new Date()
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("CSV exportado com sucesso!");
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      transactions,
      budgets
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rynance_backup_${new Date()
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("Backup JSON exportado com sucesso!");
  };

  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((a, c) => a + Number(c.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, c) => a + Number(c.amount), 0);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const storageUsed = JSON.stringify({ transactions, budgets }).length;
  const storageKB = (storageUsed / 1024).toFixed(2);

  const formatCurrency = (val) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const styles = {
    container: {
      padding: isMobile ? "20px 16px" : "32px",
      minHeight: "100vh",
      backgroundColor: "var(--ryn-bg)",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    header: { marginBottom: "32px" },
    title: {
      fontSize: isMobile ? "24px" : "30px",
      fontWeight: 800,
      background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #6D28D9 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      marginBottom: "4px",
      letterSpacing: "-0.5px"
    },
    subtitle: { fontSize: "14px", color: "var(--ryn-text-secondary)" },
    section: { marginBottom: "32px" },
    sectionTitle: {
      fontSize: "11px",
      color: "var(--ryn-text-muted)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      marginBottom: "16px",
      paddingBottom: "10px",
      borderBottom: "1px solid var(--ryn-border)"
    },
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(290px, 1fr))",
      gap: "16px"
    },
    card: (isHovered, danger) => ({
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${danger ? "rgba(239, 68, 68, 0.18)" : "var(--ryn-glass-border)"}`,
      borderRadius: "16px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      transform: isHovered ? "translateY(-2px)" : "none",
      boxShadow: isHovered
        ? "0 16px 32px -8px rgba(109, 40, 217, 0.25)"
        : "0 2px 12px rgba(0,0,0,0.12)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }),
    cardTitleRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    cardTitle: { fontSize: "15px", fontWeight: 600, color: "var(--ryn-text)" },
    cardDesc: { fontSize: "13px", color: "var(--ryn-text-secondary)", lineHeight: 1.65 },
    statsContainer: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      overflow: "hidden"
    },
    statRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 24px",
      borderBottom: "1px solid var(--ryn-border)",
      fontSize: "14px"
    },
    statLabel: { color: "var(--ryn-text-secondary)" },
    statValue: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 600,
      color: "var(--ryn-text)"
    },
    btn: (variant) => {
      const colors = {
        green: {
          bg: "rgba(34, 197, 94, 0.15)",
          color: "#22c55e",
          hoverBg: "rgba(34, 197, 94, 0.25)"
        },
        red: {
          bg: "rgba(239, 68, 68, 0.15)",
          color: "var(--ryn-red)",
          hoverBg: "rgba(239, 68, 68, 0.28)"
        },
        blue: {
          bg: "rgba(139, 92, 246, 0.15)",
          color: "#8B5CF6",
          hoverBg: "rgba(139, 92, 246, 0.25)"
        },
        ghost: {
          bg: "rgba(255,255,255,0.05)",
          color: "var(--ryn-text)",
          hoverBg: "rgba(255, 255, 255, 0.10)"
        }
      };
      const c = colors[variant] || colors.ghost;
      return {
        border: "none",
        borderRadius: "8px",
        padding: "10px 18px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        backgroundColor: c.bg,
        color: c.color,
        transition: "all 0.2s ease",
        outline: "none"
      };
    },
    confirmRow: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      flexWrap: "wrap"
    },
    confirmText: { fontSize: "13px", color: "var(--ryn-red)", fontWeight: 500 },
    successMsg: {
      backgroundColor: "rgba(34, 197, 94, 0.08)",
      border: "1px solid rgba(34, 197, 94, 0.2)",
      borderRadius: "8px",
      padding: "12px 16px",
      fontSize: "13px",
      color: "#22c55e",
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "24px"
    },
    brandCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      padding: isMobile ? "20px" : "28px 24px",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      textAlign: isMobile ? "center" : "left",
      gap: "20px"
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <header style={styles.header}>
        <h1 style={styles.title}>Configurações</h1>
        <p style={styles.subtitle}>Gerencie seus dados e preferências do Rynance</p>
      </header>

      {/* Success Message */}
      {exportMsg && (
        <div style={styles.successMsg}>
          <span>✓</span>
          <span>{exportMsg}</span>
        </div>
      )}

      {/* Perfil do Usuário */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Perfil do Usuário</div>
        <div style={{
          backgroundColor: "var(--ryn-glass)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--ryn-glass-border)",
          borderRadius: "16px",
          padding: isMobile ? "20px" : "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "24px",
          alignItems: "center",
          textAlign: isMobile ? "center" : "left"
        }}>
          {/* Avatar Area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: "50%",
              background: user && user.photo && PRESET_GRADIENTS[user.photo]
                ? PRESET_GRADIENTS[user.photo]
                : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              backgroundImage: user && user.photo && !user.photo.startsWith("preset:")
                ? `url(${user.photo})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              position: "relative",
              border: "2px solid var(--ryn-border-strong)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              overflow: "hidden"
            }}>
              {(!user || !user.photo) && (user && user.name ? user.name.charAt(0).toUpperCase() : "U")}
            </div>
            
            <label style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#8B5CF6",
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: "rgba(139, 92, 246, 0.08)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              transition: "all 0.2s ease"
            }}>
              Enviar Foto
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Form and Presets */}
          <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "16px", alignItems: isMobile ? "center" : "stretch" }}>
            <form onSubmit={handleNameSave} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px", alignItems: isMobile ? "stretch" : "flex-end", width: "100%" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                <label style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{
                    backgroundColor: "var(--ryn-input)",
                    border: "1px solid var(--ryn-border-strong)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    color: "var(--ryn-text)",
                    width: "100%",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: "#8B5CF6",
                  color: "#fff",
                  transition: "all 0.2s ease"
                }}
              >
                Salvar
              </button>
            </form>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start" }}>
              <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Gradientes Padrão
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                {Object.entries(PRESET_GRADIENTS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (updateUser) {
                        updateUser({ photo: key });
                        showSuccess("Gradiente de perfil aplicado!");
                      }
                    }}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: value,
                      border: user && user.photo === key ? "2px solid #fff" : "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transform: user && user.photo === key ? "scale(1.1)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Troca de senha */}
          <div style={{ marginTop: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Alterar Senha
            </div>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["current", "next", "confirm"].map((field, i) => (
                <div key={field} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "11px", color: "var(--ryn-text-muted)", fontWeight: 500 }}>
                    {["Senha atual", "Nova senha", "Confirmar nova senha"][i]}
                  </label>
                  <input
                    type="password"
                    value={pwForm[field]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder="••••••••"
                    style={{
                      backgroundColor: "var(--ryn-input)", border: "1px solid var(--ryn-border-strong)",
                      borderRadius: "8px", padding: "9px 12px", fontSize: "13px",
                      color: "var(--ryn-text)", outline: "none", fontFamily: "inherit"
                    }}
                    onFocus={e => e.target.style.borderColor = "#8B5CF6"}
                    onBlur={e => e.target.style.borderColor = "var(--ryn-border-strong)"}
                  />
                </div>
              ))}
              {pwError && (
                <div style={{ fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>✕</span><span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div style={{ fontSize: "12px", color: "#22c55e", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>✓</span><span>Senha alterada com sucesso!</span>
                </div>
              )}
              <button type="submit" style={{
                padding: "9px 16px", background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px",
                color: "#8B5CF6", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start"
              }}>
                Alterar senha
              </button>
            </form>
          </div>

          {/* Info da conta */}
          <div style={{ marginTop: "8px", padding: "14px 16px", backgroundColor: "rgba(139,92,246,0.04)", borderRadius: "10px", border: "1px solid var(--ryn-border)" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
              Informações da Conta
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "E-mail", value: user?.email || "—" },
                { label: "Membro desde", value: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) },
                { label: "Tipo de conta", value: "Acesso Beta" }
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--ryn-text-muted)", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "var(--ryn-text)", fontWeight: 500, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aparência */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Aparência</div>
        <div style={{
          backgroundColor: "var(--ryn-glass)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--ryn-glass-border)",
          borderRadius: "16px",
          padding: isMobile ? "20px" : "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: "16px",
          textAlign: isMobile ? "center" : "left"
        }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "4px" }}>
              Modo Escuro / Claro
            </div>
            <div style={{ fontSize: "13px", color: "var(--ryn-text-secondary)" }}>
              Escolha o tema visual da interface do Rynance
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: isMobile ? "center" : "flex-start" }}>
            <button
              onClick={() => setDarkMode(false)}
              style={{
                border: !darkMode ? "1px solid #8B5CF6" : "1px solid var(--ryn-border)",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: !darkMode ? "rgba(139,92,246,0.1)" : "transparent",
                color: !darkMode ? "#8B5CF6" : "var(--ryn-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Modo Claro
            </button>
            <button
              onClick={() => setDarkMode(true)}
              style={{
                border: darkMode ? "1px solid #8B5CF6" : "1px solid var(--ryn-border)",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: darkMode ? "rgba(139,92,246,0.1)" : "transparent",
                color: darkMode ? "#8B5CF6" : "var(--ryn-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Modo Escuro
            </button>
          </div>
        </div>
      </div>

      {/* App Stats */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Resumo dos Dados</div>
        <div style={styles.statsContainer}>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Total de Lançamentos</span>
            <span style={styles.statValue}>{totalTransactions}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Total de Receitas</span>
            <span style={{ ...styles.statValue, color: "#22c55e" }}>
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Total de Despesas</span>
            <span style={{ ...styles.statValue, color: "var(--ryn-red)" }}>
              {formatCurrency(totalExpense)}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Lançamentos Pendentes</span>
            <span
              style={{
                ...styles.statValue,
                color: pendingCount > 0 ? "#fb923c" : "#22c55e"
              }}
            >
              {pendingCount}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Orçamentos Configurados</span>
            <span style={styles.statValue}>{Object.keys(budgets).length}</span>
          </div>
          <div style={{ ...styles.statRow, borderBottom: "none" }}>
            <span style={styles.statLabel}>Armazenamento Utilizado</span>
            <span style={styles.statValue}>{storageKB} KB</span>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Exportar Dados</div>
        <div style={styles.cardsGrid}>
          <div
            onMouseEnter={() => setHoveredCard("csv")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "csv")}
          >
            <div style={styles.cardTitleRow}>
              <span style={{ fontSize: "28px" }}>📊</span>
              <span style={styles.cardTitle}>Exportar como CSV</span>
            </div>
            <p style={styles.cardDesc}>
              Exporta todos os lançamentos em formato CSV, compatível com Excel e
              Google Sheets. Inclui tipo, valor, categoria, descrição, data e status.
            </p>
            <button
              onClick={handleExportCSV}
              style={styles.btn("green")}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(74,222,128,0.25)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "rgba(74,222,128,0.15)")
              }
            >
              ⬇ Baixar Planilha CSV
            </button>
          </div>

          <div
            onMouseEnter={() => setHoveredCard("json")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "json")}
          >
            <div style={styles.cardTitleRow}>
              <span style={{ fontSize: "28px" }}>💾</span>
              <span style={styles.cardTitle}>Backup Completo (JSON)</span>
            </div>
            <p style={styles.cardDesc}>
              Exporta todos os dados — lançamentos, orçamentos e configurações — em
              formato JSON para backup completo e restauração futura.
            </p>
            <button
              onClick={handleExportJSON}
              style={styles.btn("blue")}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(59,130,246,0.25)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "rgba(59,130,246,0.15)")
              }
            >
              ⬇ Baixar Backup JSON
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Gerenciamento de Dados</div>
        <div style={styles.cardsGrid}>
          <div
            onMouseEnter={() => setHoveredCard("reset")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "reset")}
          >
            <div style={styles.cardTitleRow}>
              <span style={{ fontSize: "28px" }}>🔄</span>
              <span style={styles.cardTitle}>Restaurar Demonstração</span>
            </div>
            <p style={styles.cardDesc}>
              Substitui os lançamentos atuais pelos dados de exemplo do Rynance.
              Útil para explorar todas as funcionalidades do app.
            </p>
            {confirmReset ? (
              <div style={styles.confirmRow}>
                <span style={styles.confirmText}>Substituir dados atuais?</span>
                <button
                  onClick={handleResetDemo}
                  style={styles.btn("red")}
                >
                  Sim, restaurar
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={styles.btn("ghost")}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                style={styles.btn("ghost")}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(255,255,255,0.10)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "rgba(255,255,255,0.05)")
                }
              >
                Restaurar Dados de Exemplo
              </button>
            )}
          </div>

          <div
            onMouseEnter={() => setHoveredCard("clear")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "clear", true)}
          >
            <div style={styles.cardTitleRow}>
              <span style={{ fontSize: "28px" }}>🗑️</span>
              <span style={styles.cardTitle}>Apagar Todos os Dados</span>
            </div>
            <p style={styles.cardDesc}>
              Remove permanentemente todos os lançamentos, orçamentos e configurações.{" "}
              <strong style={{ color: "var(--ryn-red)" }}>
                Esta ação não pode ser desfeita.
              </strong>
            </p>
            {confirmClear ? (
              <div style={styles.confirmRow}>
                <span style={styles.confirmText}>⚠️ Isso é irreversível!</span>
                <button
                  onClick={handleClearAll}
                  style={styles.btn("red")}
                >
                  Apagar Tudo
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  style={styles.btn("ghost")}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                style={styles.btn("red")}
              >
                Apagar Todos os Dados
              </button>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Sobre</div>
        <div style={styles.brandCard}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              backgroundColor: "rgba(139, 92, 246, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              color: "#8B5CF6",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              flexShrink: 0
            }}
          >
            R
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--ryn-text)",
                marginBottom: "4px"
              }}
            >
              Rynance{" "}
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--ryn-text-muted)",
                  fontWeight: 400,
                  fontFamily: "'IBM Plex Mono', monospace"
                }}
              >
                v1.0.0
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Controle financeiro pessoal — simples, rápido e local.
              <br />
              Todos os dados são armazenados apenas no seu navegador.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
