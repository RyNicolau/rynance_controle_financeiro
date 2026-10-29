import React, { useState, useEffect, useCallback } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../lib/supabase";
import { usePreferences, ACCENT_COLORS } from "../contexts/PreferencesContext";
import { formatCurrency } from "../utils/formatCurrency";
import { useToast } from "../components/Toast";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, demoTransactions } from "../data/demoData";

// ─── App version from package.json (injected by Vite) ───
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

// ─── Preset avatar gradients ───
const PRESET_GRADIENTS = {
  "preset:purple": "linear-gradient(135deg, #a78bfa, #6d28d9)",
  "preset:blue": "linear-gradient(135deg, #60a5fa, #2563eb)",
  "preset:emerald": "linear-gradient(135deg, #34d399, #059669)",
  "preset:sunset": "linear-gradient(135deg, #fca5a5, #b91c1c)",
  "preset:coral": "linear-gradient(135deg, #f472b6, #db2777)"
};

// ─── Category icons and colors ───
const CATEGORY_ICONS = {
  "Alimentação": "🍽️", "Transporte": "🚗", "Moradia": "🏠",
  "Saúde": "💊", "Lazer": "🎮", "Educação": "📚",
  "Vestuário": "👕", "Assinaturas": "📱", "Outros": "📦",
  "Salário": "💼", "Freelance": "💻", "Investimentos": "📈",
  "Aluguel": "🔑", "Bônus": "🎁", "Presente": "💝"
};

const CATEGORY_COLORS = {
  "Alimentação": "#f59e0b", "Transporte": "#10b981", "Moradia": "#3b82f6",
  "Saúde": "#ef4444", "Lazer": "#ec4899", "Educação": "#8b5cf6",
  "Vestuário": "#06b6d4", "Assinaturas": "#f43f5e", "Outros": "#64748b",
  "Salário": "#10b981", "Freelance": "#3b82f6", "Investimentos": "#06b6d4",
  "Aluguel": "#f59e0b", "Bônus": "#8b5cf6", "Presente": "#ec4899"
};

const AVAILABLE_ICONS = ["📦", "🏷️", "🎯", "💡", "🔧", "🏋️", "🎵", "✈️", "🐾", "🎓", "🍕", "🏥", "💄", "🛒", "🎬", "📱", "🏠", "🚗", "💊", "🎮"];
const AVAILABLE_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4", "#f43f5e", "#64748b", "#84cc16", "#f97316", "#14b8a6"];

// ─── SVG Icons (defined outside component) ───
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconPalette = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
  </svg>
);
const IconTag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconDownload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconMonitor = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ─── Section definitions ───
const SECTIONS = [
  { id: "account", label: "Minha Conta", desc: "Perfil, senha e informações", icon: IconUser },
  { id: "appearance", label: "Aparência", desc: "Tema, cores e personalização", icon: IconPalette },
  { id: "financial", label: "Preferências Financeiras", desc: "Moeda, período e privacidade", icon: IconWallet },
  { id: "categories", label: "Categorias", desc: "Gerenciar categorias personalizadas", icon: IconTag },
  { id: "notifications", label: "Notificações", desc: "Lembretes e alertas", icon: IconBell },
  { id: "privacy", label: "Privacidade e Segurança", desc: "Conta e proteção de dados", icon: IconShield },
  { id: "export", label: "Dados e Exportação", desc: "Exportar e gerenciar dados", icon: IconDownload },
  { id: "about", label: "Sobre o Rynance", desc: "Versão, links e informações", icon: IconInfo }
];

// ─── Toggle Switch (sub-component defined outside) ───
function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      style={{
        width: "48px", height: "28px", borderRadius: "14px", border: "none",
        backgroundColor: disabled ? "rgba(100,100,100,0.2)" : enabled ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "all 0.2s ease",
        padding: 0, display: "flex", alignItems: "center",
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
        minWidth: "48px", minHeight: "28px"
      }}
    >
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        backgroundColor: enabled && !disabled ? "#8B5CF6" : "rgba(255,255,255,0.3)",
        transform: enabled ? "translateX(23px)" : "translateX(3px)",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }} />
    </button>
  );
}

// ─── Badge "Em breve" ───
function ComingSoonBadge() {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, color: "#fb923c",
      backgroundColor: "rgba(251, 146, 60, 0.12)", borderRadius: "6px",
      padding: "3px 8px", letterSpacing: "0.3px", whiteSpace: "nowrap",
      border: "1px solid rgba(251, 146, 60, 0.2)"
    }}>
      Em breve
    </span>
  );
}

// ─── Confirmation Modal (bottom sheet on mobile) ───
function ConfirmModal({ isMobile, title, message, confirmLabel, confirmColor, inputPlaceholder, inputValue, onInputChange, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)"
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: "var(--ryn-card)", border: "1px solid var(--ryn-glass-border)",
        borderRadius: isMobile ? "20px 20px 0 0" : "16px",
        padding: isMobile ? "24px 20px env(safe-area-inset-bottom, 20px)" : "28px",
        width: isMobile ? "100%" : "440px", maxWidth: "100vw",
        maxHeight: isMobile ? "85dvh" : "80vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }} onClick={(e) => e.stopPropagation()}>
        {isMobile && (
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: "var(--ryn-border-strong)", margin: "0 auto 16px" }} />
        )}
        <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--ryn-text)", marginBottom: "8px" }}>
          {title}
        </div>
        <div style={{ fontSize: "13px", color: "var(--ryn-text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
          {message}
        </div>
        {inputPlaceholder && (
          <input
            type="text"
            value={inputValue || ""}
            onChange={(e) => onInputChange && onInputChange(e.target.value)}
            placeholder={inputPlaceholder}
            autoFocus
            style={{
              width: "100%", padding: "12px 14px", fontSize: "16px",
              backgroundColor: "var(--ryn-input)", border: "1px solid var(--ryn-border-strong)",
              borderRadius: "10px", color: "var(--ryn-text)", fontFamily: "inherit",
              marginBottom: "16px", outline: "none"
            }}
          />
        )}
        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row-reverse",
          gap: "8px"
        }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              border: "none", borderRadius: "10px", padding: "14px 24px",
              fontSize: "14px", fontWeight: 600, cursor: loading ? "wait" : "pointer",
              backgroundColor: confirmColor || "rgba(239, 68, 68, 0.15)",
              color: confirmColor === "rgba(239, 68, 68, 0.15)" || !confirmColor ? "#ef4444" : "#fff",
              width: isMobile ? "100%" : "auto",
              opacity: loading ? 0.6 : 1,
              fontFamily: "inherit",
              minHeight: "48px"
            }}
          >
            {loading ? "Processando..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            style={{
              border: "1px solid var(--ryn-border)", borderRadius: "10px",
              padding: "14px 24px", fontSize: "14px", fontWeight: 500,
              cursor: "pointer", backgroundColor: "transparent",
              color: "var(--ryn-text-secondary)", width: isMobile ? "100%" : "auto",
              fontFamily: "inherit", minHeight: "48px"
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Glass card wrapper ───
function GlassCard({ children, style }) {
  return (
    <div style={{
      backgroundColor: "var(--ryn-glass)", backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      ...style
    }}>
      {children}
    </div>
  );
}

// ─── Setting row ───
function SettingRow({ label, description, children, style }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 0", borderBottom: "1px solid var(--ryn-border)",
      gap: "16px", minHeight: "56px", ...style
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ryn-text)", marginBottom: description ? "2px" : 0 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Section header with back button (mobile) ───
function SectionHeader({ isMobile, title, onBack }) {
  if (!isMobile) return null;
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      backgroundColor: "var(--ryn-bg)", backdropFilter: "blur(16px)",
      padding: "16px 0", marginBottom: "8px",
      display: "flex", alignItems: "center", gap: "12px",
      borderBottom: "1px solid var(--ryn-border)"
    }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--ryn-text)", display: "flex", alignItems: "center",
        padding: "8px", margin: "-8px", borderRadius: "8px",
        minWidth: "44px", minHeight: "44px", justifyContent: "center"
      }}>
        <IconArrowLeft />
      </button>
      <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--ryn-text)" }}>
        {title}
      </span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// ══  MAIN SETTINGS COMPONENT
// ═══════════════════════════════════════════════════════════

export default function Settings({
  transactions,
  setTransactions,
  budgets,
  setBudgets,
  user,
  updateUser
}) {
  const isMobile = useIsMobile();
  const { preferences, updatePreference, toggleHideValues, accentColor } = usePreferences();
  const { showToast, ToastPortal } = useToast();

  // ─── Section navigation ───
  const [activeSection, setActiveSection] = useState(isMobile ? null : "account");

  // ─── Account state ───
  const [profileName, setProfileName] = useState(user ? user.name : "");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  // ─── Categories state ───
  const [customCategories, setCustomCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", type: "expense", icon: "📦", color: "#64748b" });
  const [editingCat, setEditingCat] = useState(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);

  // ─── Delete account state ───
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Export ───
  const [exportLoading, setExportLoading] = useState(null);

  // ─── Email update state ───
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // ─── Reset / Clear data state ───
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");

  useEffect(() => {
    if (user) setProfileName(user.name);
  }, [user]);

  // Load custom categories
  useEffect(() => {
    if (!user?.id) return;
    const loadCategories = async () => {
      setCatLoading(true);
      try {
        const { data } = await supabase
          .from("custom_categories")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: true });
        setCustomCategories(data || []);
      } catch { /* ignore */ }
      setCatLoading(false);
    };
    loadCategories();
  }, [user?.id]);

  // ─── Handlers ───

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast("O nome não pode ser vazio.", "error");
      return;
    }
    setNameSaving(true);
    try {
      await updateUser({ name: profileName.trim() });
      showToast("Nome atualizado com sucesso!");
    } catch {
      showToast("Erro ao atualizar nome.", "error");
    }
    setNameSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current) { setPwError("Informe a senha atual."); return; }
    if (!pwForm.next) { setPwError("Informe a nova senha."); return; }
    if (pwForm.next.length < 6) { setPwError("A nova senha deve ter ao menos 6 caracteres."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("As senhas não conferem."); return; }

    setPwLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email, password: pwForm.current
      });
      if (signInErr) { setPwError("Senha atual incorreta."); setPwLoading(false); return; }

      const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.next });
      if (updateErr) { setPwError("Erro ao atualizar senha."); setPwLoading(false); return; }

      setPwForm({ current: "", next: "", confirm: "" });
      showToast("Senha alterada com sucesso!");
    } catch {
      setPwError("Erro ao atualizar senha.");
    }
    setPwLoading(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione um arquivo de imagem válido.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 128; canvas.height = 128;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        if (updateUser) {
          updateUser({ photo: dataUrl });
          showToast("Foto de perfil atualizada!");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Export handlers
  const handleExportCSV = () => {
    setExportLoading("csv");
    try {
      const headers = ["ID", "Tipo", "Valor", "Categoria", "Descrição", "Data", "Status"];
      const rows = transactions.map((tx) => [
        tx.id,
        tx.type === "income" ? "Receita" : "Despesa",
        Number(tx.amount).toFixed(2).replace(".", ","),
        tx.category,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.date,
        tx.status === "paid" ? (tx.type === "income" ? "Recebido" : "Pago") : "Pendente"
      ]);
      const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `rynance_lancamentos_${dateStamp()}.csv`);
      showToast("CSV exportado com sucesso!");
    } catch {
      showToast("Erro ao exportar CSV.", "error");
    }
    setExportLoading(null);
  };

  const handleExportJSON = () => {
    setExportLoading("json");
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        version: APP_VERSION,
        user: { name: user?.name, email: user?.email },
        preferences,
        transactions,
        budgets,
        customCategories
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      downloadBlob(blob, `rynance_backup_${dateStamp()}.json`);
      showToast("Backup JSON exportado com sucesso!");
    } catch {
      showToast("Erro ao exportar JSON.", "error");
    }
    setExportLoading(null);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dateStamp = () => new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");

  // Email update handler
  const handleEmailUpdate = async () => {
    if (!newEmail.trim() || newEmail.trim() === user?.email) {
      showToast("Informe um e-mail diferente do atual.", "warning");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      showToast("Informe um e-mail válido.", "error");
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        if (error.message?.toLowerCase().includes("rate limit") || error.status === 429) {
          showToast("Muitas solicitações. Aguarde alguns instantes antes de tentar novamente.", "warning");
        } else {
          showToast(error.message || "Erro ao solicitar alteração de e-mail.", "error");
        }
      } else {
        showToast("Link de confirmação enviado para o novo e-mail!", "success");
        setShowEmailModal(false);
      }
    } catch {
      showToast("Erro ao conectar ao serviço de autenticação.", "error");
    }
    setEmailLoading(false);
  };

  // Restore demo and clear data handlers
  const handleRestoreDemo = async () => {
    try {
      const defaultBudgets = {
        "Alimentação": 1200, "Transporte": 500, "Moradia": 1500,
        "Saúde": 400, "Lazer": 350, "Educação": 300,
        "Vestuário": 250, "Assinaturas": 150, "Outros": 200
      };
      await setTransactions(demoTransactions);
      await setBudgets(defaultBudgets);
      showToast("Dados de demonstração restaurados!");
    } catch {
      showToast("Erro ao restaurar dados demo.", "error");
    }
    setShowResetDemoConfirm(false);
  };

  const handleClearData = async () => {
    if (clearConfirmText !== "LIMPAR") {
      showToast('Digite "LIMPAR" para confirmar.', "error");
      return;
    }
    try {
      await setTransactions([]);
      await setBudgets({});
      showToast("Todos os lançamentos foram apagados.");
    } catch {
      showToast("Erro ao limpar dados.", "error");
    }
    setShowClearDataConfirm(false);
    setClearConfirmText("");
  };

  // Category handlers
  const handleAddCategory = async () => {
    if (!newCat.name.trim()) {
      showToast("O nome da categoria não pode ser vazio.", "error");
      return;
    }
    // Check duplicate
    const allCats = getAllCategories(newCat.type);
    if (allCats.some(c => c.name.toLowerCase() === newCat.name.trim().toLowerCase())) {
      showToast("Já existe uma categoria com esse nome.", "error");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("custom_categories")
        .insert({ user_id: user.id, name: newCat.name.trim(), type: newCat.type, icon: newCat.icon, color: newCat.color })
        .select()
        .single();
      if (error) throw error;
      setCustomCategories(prev => [...prev, data]);
      setNewCat({ name: "", type: "expense", icon: "📦", color: "#64748b" });
      setShowAddCategory(false);
      showToast("Categoria criada com sucesso!");
    } catch {
      showToast("Erro ao criar categoria.", "error");
    }
  };

  const handleUpdateCategory = async (cat) => {
    try {
      const { error } = await supabase
        .from("custom_categories")
        .update({ name: cat.name, icon: cat.icon, color: cat.color })
        .eq("id", cat.id);
      if (error) throw error;
      setCustomCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
      setEditingCat(null);
      showToast("Categoria atualizada!");
    } catch {
      showToast("Erro ao atualizar categoria.", "error");
    }
  };

  const handleDeleteCategory = async (cat) => {
    // Check if category has transactions
    const hasTransactions = transactions.some(t => t.category === cat.name);
    if (hasTransactions) {
      // Archive instead of delete
      try {
        const { error } = await supabase
          .from("custom_categories")
          .update({ is_archived: true })
          .eq("id", cat.id);
        if (error) throw error;
        setCustomCategories(prev => prev.filter(c => c.id !== cat.id));
        showToast("Categoria arquivada. As movimentações foram preservadas.", "warning");
      } catch {
        showToast("Erro ao arquivar categoria.", "error");
      }
    } else {
      try {
        const { error } = await supabase
          .from("custom_categories")
          .delete()
          .eq("id", cat.id);
        if (error) throw error;
        setCustomCategories(prev => prev.filter(c => c.id !== cat.id));
        showToast("Categoria excluída!");
      } catch {
        showToast("Erro ao excluir categoria.", "error");
      }
    }
    setDeleteCatConfirm(null);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") {
      showToast("Digite EXCLUIR para confirmar.", "error");
      return;
    }
    setDeleteLoading(true);
    try {
      // Delete user data first
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await supabase.from("budgets").delete().eq("user_id", user.id);
      await supabase.from("custom_categories").delete().eq("user_id", user.id);
      await supabase.from("user_preferences").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      // Sign out
      await supabase.auth.signOut();
      localStorage.removeItem("ryn_preferences");
      localStorage.removeItem("ryn_theme");
      window.location.reload();
    } catch {
      showToast("Erro ao excluir conta. Tente novamente.", "error");
      setDeleteLoading(false);
    }
  };

  // Get all categories (default + custom)
  const getAllCategories = useCallback((type) => {
    const defaults = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const defaultList = defaults.map(name => ({
      name, type, icon: CATEGORY_ICONS[name] || "📦",
      color: CATEGORY_COLORS[name] || "#64748b", isDefault: true
    }));
    const custom = customCategories
      .filter(c => c.type === type)
      .map(c => ({ ...c, isDefault: false }));
    return [...defaultList, ...custom];
  }, [customCategories]);

  // ─── Style helpers ───
  const inputStyle = {
    width: "100%", padding: "12px 14px", fontSize: "16px",
    backgroundColor: "var(--ryn-input)", border: "1px solid var(--ryn-border-strong)",
    borderRadius: "10px", color: "var(--ryn-text)", fontFamily: "inherit",
    outline: "none"
  };

  const primaryBtnStyle = {
    border: "none", borderRadius: "10px", padding: "12px 20px",
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    backgroundColor: "#8B5CF6", color: "#fff",
    transition: "all 0.2s ease", fontFamily: "inherit",
    minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
  };

  const ghostBtnStyle = {
    border: "1px solid var(--ryn-border)", borderRadius: "10px",
    padding: "12px 20px", fontSize: "14px", fontWeight: 500,
    cursor: "pointer", backgroundColor: "transparent",
    color: "var(--ryn-text-secondary)", fontFamily: "inherit",
    transition: "all 0.2s ease", minHeight: "44px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
  };


  // ═══════════════════════════════════
  // ══  SECTION RENDERERS
  // ═══════════════════════════════════

  // ── 1. Minha Conta ──
  const renderAccount = () => (
    <div>
      <SectionHeader isMobile={isMobile} title="Minha Conta" onBack={() => setActiveSection(null)} />

      {/* Avatar + Foto */}
      <GlassCard style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: isMobile ? "center" : "flex-start", flexDirection: isMobile ? "column" : "row", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: user?.photo && PRESET_GRADIENTS[user.photo]
                ? PRESET_GRADIENTS[user.photo]
                : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              backgroundImage: user?.photo && !user.photo.startsWith("preset:")
                ? `url(${user.photo})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, color: "#fff",
              border: "2px solid var(--ryn-border-strong)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)", overflow: "hidden"
            }}>
              {(!user?.photo) && (user?.name ? user.name.charAt(0).toUpperCase() : "U")}
            </div>
            <label style={{
              fontSize: "12px", fontWeight: 600, color: "#8B5CF6",
              cursor: "pointer", padding: "6px 12px", borderRadius: "8px",
              backgroundColor: "rgba(139, 92, 246, 0.08)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              minHeight: "32px", display: "flex", alignItems: "center"
            }}>
              Enviar Foto
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Gradient Presets */}
            <div>
              <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Gradientes Padrão
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                {Object.entries(PRESET_GRADIENTS).map(([key, value]) => (
                  <button key={key} onClick={() => {
                    updateUser({ photo: key });
                    showToast("Gradiente de perfil aplicado!");
                  }}
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", background: value,
                      border: user?.photo === key ? "2px solid #fff" : "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transform: user?.photo === key ? "scale(1.1)" : "none",
                      transition: "all 0.2s ease", minWidth: "36px", minHeight: "36px"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Nome */}
      <GlassCard style={{ marginBottom: "16px" }}>
        <form onSubmit={handleNameSave}>
          <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
            Nome de Usuário
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
            <input type="text" value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" disabled={nameSaving}
              style={{ ...primaryBtnStyle, opacity: nameSaving ? 0.6 : 1, width: isMobile ? "100%" : "auto" }}>
              {nameSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Info da Conta */}
      <GlassCard style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>
          Informações da Conta
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--ryn-text-muted)" }}>E-mail</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--ryn-text)", fontWeight: 500, wordBreak: "break-all" }}>{user?.email || "—"}</span>
              <button
                type="button"
                onClick={() => { setNewEmail(user?.email || ""); setShowEmailModal(true); }}
                style={{
                  background: "none", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "6px",
                  color: "#8B5CF6", fontSize: "11px", fontWeight: 600, padding: "3px 8px", cursor: "pointer",
                  backgroundColor: "rgba(139,92,246,0.06)"
                }}
              >
                Alterar
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--ryn-text-muted)" }}>Tipo de conta</span>
            <span style={{ fontSize: "13px", color: "var(--ryn-text)", fontWeight: 500 }}>Conta pessoal</span>
          </div>
        </div>
      </GlassCard>

      {showEmailModal && (
        <ConfirmModal
          isMobile={isMobile}
          title="Alterar E-mail da Conta"
          message="Um link de confirmação será enviado para o novo e-mail informado. A alteração só será efetivada após a confirmação no link."
          confirmLabel={emailLoading ? "Enviando..." : "Enviar link de confirmação"}
          confirmColor="#8B5CF6"
          inputPlaceholder="Digite o novo e-mail"
          inputValue={newEmail}
          onInputChange={setNewEmail}
          onConfirm={handleEmailUpdate}
          onCancel={() => { setShowEmailModal(false); }}
          loading={emailLoading}
        />
      )}

      {/* Alterar Senha */}
      <GlassCard>
        <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>
          Alterar Senha
        </div>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { field: "current", label: "Senha atual" },
            { field: "next", label: "Nova senha" },
            { field: "confirm", label: "Confirmar nova senha" }
          ].map(({ field, label }) => (
            <div key={field} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", color: "var(--ryn-text-muted)", fontWeight: 500 }}>
                {label}
              </label>
              <input
                type="password" value={pwForm[field]}
                onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          ))}
          {pwError && (
            <div style={{ fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "5px" }}>
              <span>✕</span><span>{pwError}</span>
            </div>
          )}
          <button type="submit" disabled={pwLoading}
            style={{ ...ghostBtnStyle, alignSelf: isMobile ? "stretch" : "flex-start", color: "#8B5CF6", borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.08)" }}>
            {pwLoading ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </GlassCard>
    </div>
  );

  // ── 2. Aparência ──
  const renderAppearance = () => {
    const themeOptions = [
      { value: "light", label: "Claro", icon: <IconSun /> },
      { value: "dark", label: "Escuro", icon: <IconMoon /> },
      { value: "auto", label: "Automático", icon: <IconMonitor /> }
    ];

    return (
      <div>
        <SectionHeader isMobile={isMobile} title="Aparência" onBack={() => setActiveSection(null)} />

        {/* Tema */}
        <GlassCard style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "4px" }}>Tema</div>
          <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", marginBottom: "16px" }}>Escolha o tema visual da interface</div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px",
            backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px"
          }}>
            {themeOptions.map(opt => (
              <button key={opt.value} onClick={() => updatePreference("theme", opt.value)}
                style={{
                  border: preferences.theme === opt.value ? "1px solid rgba(139,92,246,0.5)" : "1px solid transparent",
                  borderRadius: "10px", padding: "12px 8px",
                  fontSize: "13px", fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: preferences.theme === opt.value ? "rgba(139,92,246,0.12)" : "transparent",
                  color: preferences.theme === opt.value ? "#8B5CF6" : "var(--ryn-text-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  transition: "all 0.2s ease", fontFamily: "inherit",
                  minHeight: "44px"
                }}>
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Cor de Destaque */}
        <GlassCard>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "4px" }}>Cor de Destaque</div>
          <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", marginBottom: "16px" }}>Personalize a cor principal da interface</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
            gap: "8px"
          }}>
            {Object.entries(ACCENT_COLORS).map(([key, val]) => (
              <button key={key} onClick={() => updatePreference("accent_color", key)}
                style={{
                  borderRadius: "12px", padding: "12px 8px",
                  border: preferences.accent_color === key ? `2px solid ${val.primary}` : "1px solid var(--ryn-border)",
                  backgroundColor: preferences.accent_color === key ? `${val.primary}15` : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "8px", transition: "all 0.2s ease",
                  minHeight: "44px", fontFamily: "inherit"
                }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: val.gradient, boxShadow: preferences.accent_color === key ? `0 0 12px ${val.primary}50` : "none"
                }} />
                <span style={{ fontSize: "11px", fontWeight: 500, color: preferences.accent_color === key ? val.primary : "var(--ryn-text-muted)" }}>
                  {val.label}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  };

  // ── 3. Preferências Financeiras ──
  const renderFinancial = () => (
    <div>
      <SectionHeader isMobile={isMobile} title="Preferências Financeiras" onBack={() => setActiveSection(null)} />

      <GlassCard>
        {/* Moeda */}
        <SettingRow label="Moeda" description="Moeda utilizada para exibição dos valores">
          <select
            value={preferences.currency}
            onChange={(e) => updatePreference("currency", e.target.value)}
            style={{
              backgroundColor: "var(--ryn-input)", border: "1px solid var(--ryn-border-strong)",
              borderRadius: "8px", padding: "8px 12px", fontSize: "14px",
              color: "var(--ryn-text)", fontFamily: "inherit", cursor: "pointer",
              minHeight: "44px", outline: "none"
            }}
          >
            <option value="BRL">R$ — Real Brasileiro</option>
            <option value="USD">$ — Dólar Americano</option>
            <option value="EUR">€ — Euro</option>
          </select>
        </SettingRow>

        {/* Dia início do mês */}
        <SettingRow label="Início do mês financeiro" description="Dia em que seu mês financeiro começa">
          <select
            value={preferences.month_start_day}
            onChange={(e) => updatePreference("month_start_day", Number(e.target.value))}
            style={{
              backgroundColor: "var(--ryn-input)", border: "1px solid var(--ryn-border-strong)",
              borderRadius: "8px", padding: "8px 12px", fontSize: "14px",
              color: "var(--ryn-text)", fontFamily: "inherit", cursor: "pointer",
              minHeight: "44px", outline: "none", minWidth: "80px"
            }}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>Dia {day}</option>
            ))}
          </select>
        </SettingRow>

        {/* Ocultar valores */}
        <SettingRow
          label="Ocultar valores"
          description="Esconde todos os valores financeiros da tela"
          style={{ borderBottom: "none" }}
        >
          <button onClick={toggleHideValues} style={{
            background: "none", border: "none", cursor: "pointer",
            color: preferences.hide_values ? "#8B5CF6" : "var(--ryn-text-muted)",
            display: "flex", alignItems: "center", gap: "8px", padding: "8px",
            minWidth: "44px", minHeight: "44px", justifyContent: "center"
          }}>
            {preferences.hide_values ? <IconEyeOff /> : <IconEye />}
          </button>
          <ToggleSwitch enabled={preferences.hide_values} onChange={() => toggleHideValues()} />
        </SettingRow>
      </GlassCard>
    </div>
  );

  // ── 4. Categorias ──
  const renderCategories = () => (
    <div>
      <SectionHeader isMobile={isMobile} title="Categorias" onBack={() => setActiveSection(null)} />

      {/* Categorias de Despesa */}
      <GlassCard style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)" }}>Categorias de Despesa</div>
            <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)" }}>Padrão e personalizadas</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {getAllCategories("expense").map(cat => (
            <CategoryItem key={cat.name + cat.type}
              cat={cat} isMobile={isMobile}
              editingCat={editingCat} setEditingCat={setEditingCat}
              onUpdate={handleUpdateCategory}
              onDelete={(c) => setDeleteCatConfirm(c)}
              transactions={transactions}
            />
          ))}
        </div>
      </GlassCard>

      {/* Categorias de Receita */}
      <GlassCard style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)" }}>Categorias de Receita</div>
            <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)" }}>Padrão e personalizadas</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {getAllCategories("income").map(cat => (
            <CategoryItem key={cat.name + cat.type}
              cat={cat} isMobile={isMobile}
              editingCat={editingCat} setEditingCat={setEditingCat}
              onUpdate={handleUpdateCategory}
              onDelete={(c) => setDeleteCatConfirm(c)}
              transactions={transactions}
            />
          ))}
        </div>
      </GlassCard>

      {/* Adicionar Categoria */}
      {!showAddCategory ? (
        <button onClick={() => setShowAddCategory(true)}
          style={{ ...primaryBtnStyle, width: "100%" }}>
          <IconPlus /> Adicionar Categoria
        </button>
      ) : (
        <GlassCard>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "16px" }}>
            Nova Categoria
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
              <input type="text" value={newCat.name}
                onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                placeholder="Nome da categoria" style={{ ...inputStyle, flex: 1 }}
              />
              <select value={newCat.type}
                onChange={e => setNewCat(p => ({ ...p, type: e.target.value }))}
                style={{
                  ...inputStyle, flex: isMobile ? undefined : "0 0 160px",
                  cursor: "pointer"
                }}>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            {/* Ícone */}
            <div>
              <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Ícone
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {AVAILABLE_ICONS.map(icon => (
                  <button key={icon} onClick={() => setNewCat(p => ({ ...p, icon }))}
                    style={{
                      width: "40px", height: "40px", borderRadius: "8px",
                      border: newCat.icon === icon ? "2px solid #8B5CF6" : "1px solid var(--ryn-border)",
                      backgroundColor: newCat.icon === icon ? "rgba(139,92,246,0.1)" : "transparent",
                      cursor: "pointer", fontSize: "18px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      minWidth: "40px", minHeight: "40px"
                    }}>{icon}</button>
                ))}
              </div>
            </div>

            {/* Cor */}
            <div>
              <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Cor
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {AVAILABLE_COLORS.map(color => (
                  <button key={color} onClick={() => setNewCat(p => ({ ...p, color }))}
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      backgroundColor: color,
                      border: newCat.color === color ? "2px solid #fff" : "2px solid transparent",
                      cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      minWidth: "32px", minHeight: "32px"
                    }} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexDirection: isMobile ? "column" : "row" }}>
              <button onClick={handleAddCategory} style={{ ...primaryBtnStyle, flex: 1 }}>
                Criar Categoria
              </button>
              <button onClick={() => setShowAddCategory(false)} style={{ ...ghostBtnStyle, flex: isMobile ? 1 : "0 0 auto" }}>
                Cancelar
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Delete confirmation */}
      {deleteCatConfirm && (
        <ConfirmModal
          isMobile={isMobile}
          title="Excluir Categoria"
          message={
            transactions.some(t => t.category === deleteCatConfirm.name)
              ? `A categoria "${deleteCatConfirm.name}" possui movimentações vinculadas. Ela será arquivada e as movimentações serão preservadas.`
              : `Tem certeza que deseja excluir a categoria "${deleteCatConfirm.name}"?`
          }
          confirmLabel={transactions.some(t => t.category === deleteCatConfirm.name) ? "Arquivar" : "Excluir"}
          onConfirm={() => handleDeleteCategory(deleteCatConfirm)}
          onCancel={() => setDeleteCatConfirm(null)}
        />
      )}
    </div>
  );

  // ── 5. Notificações ──
  const renderNotifications = () => (
    <div>
      <SectionHeader isMobile={isMobile} title="Notificações" onBack={() => setActiveSection(null)} />

      <GlassCard>
        <SettingRow label="Lembretes de vencimento" description="Receba lembretes antes das contas vencerem">
          <ComingSoonBadge />
          <ToggleSwitch enabled={false} onChange={() => {}} disabled />
        </SettingRow>
        <SettingRow label="Alertas de orçamento" description="Notificação quando ultrapassar um limite de gastos">
          <ComingSoonBadge />
          <ToggleSwitch enabled={false} onChange={() => {}} disabled />
        </SettingRow>
        <SettingRow label="Resumo mensal" description="Receba um resumo das suas finanças todo mês" style={{ borderBottom: "none" }}>
          <ComingSoonBadge />
          <ToggleSwitch enabled={false} onChange={() => {}} disabled />
        </SettingRow>
      </GlassCard>

      <div style={{
        marginTop: "16px", padding: "16px", borderRadius: "12px",
        backgroundColor: "rgba(251, 146, 60, 0.06)", border: "1px solid rgba(251, 146, 60, 0.15)",
        fontSize: "13px", color: "var(--ryn-text-secondary)", lineHeight: 1.5
      }}>
        As notificações serão implementadas em uma atualização futura. Quando disponíveis, seus controles estarão aqui.
      </div>
    </div>
  );

  // ── 6. Privacidade e Segurança ──
  const renderPrivacy = () => (
    <div>
      <SectionHeader isMobile={isMobile} title="Privacidade e Segurança" onBack={() => setActiveSection(null)} />

      <GlassCard style={{ marginBottom: "16px" }}>
        <SettingRow label="Dados isolados" description="Seus dados são protegidos por Row Level Security no banco de dados">
          <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>✓ Ativo</span>
        </SettingRow>
        <SettingRow label="Ocultar valores financeiros" description="Ative o modo privacidade para esconder valores" style={{ borderBottom: "none" }}>
          <ToggleSwitch enabled={preferences.hide_values} onChange={() => toggleHideValues()} />
        </SettingRow>
      </GlassCard>

      {/* Excluir conta */}
      <GlassCard style={{ borderColor: "rgba(239, 68, 68, 0.18)" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#ef4444", marginBottom: "4px" }}>
          Zona de Perigo
        </div>
        <div style={{ fontSize: "13px", color: "var(--ryn-text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
          A exclusão da conta remove permanentemente todos os seus dados, incluindo lançamentos, orçamentos e configurações. Esta ação não pode ser desfeita.
        </div>
        <button onClick={() => setShowDeleteAccount(true)}
          style={{
            ...ghostBtnStyle,
            color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)",
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            width: isMobile ? "100%" : "auto"
          }}>
          Excluir minha conta
        </button>
      </GlassCard>

      {showDeleteAccount && (
        <ConfirmModal
          isMobile={isMobile}
          title="Excluir Conta Permanentemente"
          message="Esta ação é irreversível. Todos os seus dados serão apagados permanentemente. Para confirmar, digite EXCLUIR no campo abaixo."
          confirmLabel="Excluir minha conta"
          inputPlaceholder='Digite "EXCLUIR" para confirmar'
          inputValue={deleteConfirmText}
          onInputChange={setDeleteConfirmText}
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteAccount(false); setDeleteConfirmText(""); }}
          loading={deleteLoading}
        />
      )}
    </div>
  );

  // ── 7. Dados e Exportação ──
  const renderExport = () => {
    const totalTransactions = transactions.length;
    const totalIncome = transactions.filter(t => t.type === "income").reduce((a, c) => a + Number(c.amount), 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, c) => a + Number(c.amount), 0);
    const pendingCount = transactions.filter(t => t.status === "pending").length;
    const fmtOpts = { hideValues: preferences.hide_values, currency: preferences.currency };

    return (
      <div>
        <SectionHeader isMobile={isMobile} title="Dados e Exportação" onBack={() => setActiveSection(null)} />

        {/* Resumo */}
        <GlassCard style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "16px" }}>
            Resumo dos Dados
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Total de Lançamentos", value: String(totalTransactions), color: "var(--ryn-text)" },
              { label: "Total de Receitas", value: formatCurrency(totalIncome, fmtOpts), color: "#22c55e" },
              { label: "Total de Despesas", value: formatCurrency(totalExpense, fmtOpts), color: "var(--ryn-red)" },
              { label: "Lançamentos Pendentes", value: String(pendingCount), color: pendingCount > 0 ? "#fb923c" : "#22c55e" },
              { label: "Orçamentos Configurados", value: String(Object.keys(budgets).length), color: "var(--ryn-text)" }
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0",
                borderBottom: i < arr.length - 1 ? "1px solid var(--ryn-border)" : "none"
              }}>
                <span style={{ fontSize: "13px", color: "var(--ryn-text-secondary)" }}>{label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Exportar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "12px"
        }}>
          <GlassCard>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>📊</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)" }}>Exportar CSV</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ryn-text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>
              Exporta lançamentos em formato CSV, compatível com Excel e Google Sheets.
            </p>
            <button onClick={handleExportCSV} disabled={exportLoading === "csv"}
              style={{
                ...ghostBtnStyle, width: "100%", color: "#22c55e",
                borderColor: "rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.06)"
              }}>
              {exportLoading === "csv" ? "Exportando..." : "⬇ Baixar CSV"}
            </button>
          </GlassCard>

          <GlassCard>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>💾</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)" }}>Backup Completo</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ryn-text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>
              Exporta todos os dados em formato JSON, incluindo preferências e categorias.
            </p>
            <button onClick={handleExportJSON} disabled={exportLoading === "json"}
              style={{
                ...ghostBtnStyle, width: "100%", color: "#8B5CF6",
                borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.06)"
              }}>
              {exportLoading === "json" ? "Exportando..." : "⬇ Baixar JSON"}
            </button>
          </GlassCard>
        </div>

        {/* Gerenciamento de Dados */}
        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
          <GlassCard>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>🔄</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)" }}>Restaurar Demonstração</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ryn-text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>
              Carrega o conjunto completo de lançamentos e orçamentos de demonstração.
            </p>
            <button onClick={() => setShowResetDemoConfirm(true)}
              style={{
                ...ghostBtnStyle, width: "100%", color: "#3b82f6",
                borderColor: "rgba(59,130,246,0.3)", backgroundColor: "rgba(59,130,246,0.06)"
              }}>
              Restaurar dados demo
            </button>
          </GlassCard>

          <GlassCard style={{ borderColor: "rgba(239, 68, 68, 0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>🗑️</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#ef4444" }}>Limpar Lançamentos</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ryn-text-secondary)", lineHeight: 1.5, marginBottom: "12px" }}>
              Apaga todos os lançamentos e orçamentos cadastrados, mantendo suas preferências.
            </p>
            <button onClick={() => setShowClearDataConfirm(true)}
              style={{
                ...ghostBtnStyle, width: "100%", color: "#ef4444",
                borderColor: "rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.06)"
              }}>
              Limpar todos os dados
            </button>
          </GlassCard>
        </div>

        {showResetDemoConfirm && (
          <ConfirmModal
            isMobile={isMobile}
            title="Restaurar Dados de Demonstração"
            message="Isso substituirá seus lançamentos e orçamentos atuais pelo conjunto padrão de demonstração."
            confirmLabel="Sim, restaurar dados"
            confirmColor="#3b82f6"
            onConfirm={handleRestoreDemo}
            onCancel={() => setShowResetDemoConfirm(false)}
          />
        )}

        {showClearDataConfirm && (
          <ConfirmModal
            isMobile={isMobile}
            title="Limpar Todos os Lançamentos"
            message="Tem certeza de que deseja apagar todos os lançamentos e orçamentos? Esta ação não pode ser desfeita. Para confirmar, digite LIMPAR abaixo."
            confirmLabel="Limpar dados"
            confirmColor="#ef4444"
            inputPlaceholder='Digite "LIMPAR" para confirmar'
            inputValue={clearConfirmText}
            onInputChange={setClearConfirmText}
            onConfirm={handleClearData}
            onCancel={() => { setShowClearDataConfirm(false); setClearConfirmText(""); }}
          />
        )}
      </div>
    );
  };

  // ── 8. Sobre o Rynance ──
  const renderAbout = () => (
    <div>
      <SectionHeader isMobile={isMobile} title="Sobre o Rynance" onBack={() => setActiveSection(null)} />

      <GlassCard style={{ marginBottom: "16px" }}>
        <div style={{
          display: "flex", alignItems: isMobile ? "center" : "flex-start",
          flexDirection: isMobile ? "column" : "row", gap: "16px",
          textAlign: isMobile ? "center" : "left"
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            backgroundColor: "rgba(139, 92, 246, 0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", fontWeight: 700, color: "#8B5CF6",
            fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0
          }}>R</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ryn-text)", marginBottom: "4px" }}>
              Rynance{" "}
              <span style={{
                fontSize: "12px", color: "var(--ryn-text-muted)", fontWeight: 400,
                fontFamily: "'IBM Plex Mono', monospace"
              }}>
                v{APP_VERSION}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--ryn-text-secondary)", lineHeight: 1.6 }}>
              Controle financeiro pessoal — simples, rápido e seguro.
              <br />Seus dados são armazenados de forma segura e isolada.
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            { label: "Política de Privacidade", available: false },
            { label: "Termos de Uso", available: false },
            { label: "Suporte", available: false }
          ].map(({ label, available }, i, arr) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderBottom: i < arr.length - 1 ? "1px solid var(--ryn-border)" : "none",
              opacity: available ? 1 : 0.5
            }}>
              <span style={{ fontSize: "14px", color: "var(--ryn-text)" }}>{label}</span>
              {available ? <IconChevronRight /> : <ComingSoonBadge />}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  // ─── Section content router ───
  const renderSectionContent = () => {
    switch (activeSection) {
      case "account": return renderAccount();
      case "appearance": return renderAppearance();
      case "financial": return renderFinancial();
      case "categories": return renderCategories();
      case "notifications": return renderNotifications();
      case "privacy": return renderPrivacy();
      case "export": return renderExport();
      case "about": return renderAbout();
      default: return null;
    }
  };

  // ─── Mobile: Menu List ───
  const renderMobileMenu = () => (
    <div>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "24px", fontWeight: 800,
          background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #6D28D9 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          marginBottom: "4px", letterSpacing: "-0.5px"
        }}>Configurações</h1>
        <p style={{ fontSize: "14px", color: "var(--ryn-text-secondary)" }}>
          Gerencie seus dados e preferências
        </p>
      </header>

      {/* Quick toggle: hide values */}
      <GlassCard style={{ marginBottom: "16px", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: preferences.hide_values ? "#8B5CF6" : "var(--ryn-text-muted)" }}>
              {preferences.hide_values ? <IconEyeOff /> : <IconEye />}
            </span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ryn-text)" }}>
                Ocultar valores
              </div>
              <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)" }}>
                Modo privacidade
              </div>
            </div>
          </div>
          <ToggleSwitch enabled={preferences.hide_values} onChange={() => toggleHideValues()} />
        </div>
      </GlassCard>

      {/* Section list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "16px 16px", backgroundColor: "var(--ryn-glass)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                border: "1px solid var(--ryn-glass-border)",
                borderRadius: "14px", cursor: "pointer",
                transition: "all 0.15s ease", textAlign: "left",
                width: "100%", marginBottom: "6px",
                minHeight: "64px", fontFamily: "inherit"
              }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#8B5CF6", flexShrink: 0
              }}>
                <SectionIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ryn-text)" }}>
                  {section.label}
                </div>
                <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", marginTop: "2px" }}>
                  {section.desc}
                </div>
              </div>
              <div style={{ color: "var(--ryn-text-muted)", flexShrink: 0 }}>
                <IconChevronRight />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Desktop: Sidebar + Content ───
  const renderDesktopLayout = () => (
    <div style={{ display: "flex", gap: "24px", minHeight: "calc(100vh - 120px)" }}>
      {/* Sidebar */}
      <div style={{
        width: "260px", flexShrink: 0,
        position: "sticky", top: "32px", alignSelf: "flex-start"
      }}>
        <div style={{
          backgroundColor: "var(--ryn-glass)", backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--ryn-glass-border)",
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)"
        }}>
          {SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 16px", width: "100%",
                  backgroundColor: isActive ? "rgba(139, 92, 246, 0.1)" : "transparent",
                  border: "none", borderLeft: isActive ? "3px solid #8B5CF6" : "3px solid transparent",
                  cursor: "pointer", transition: "all 0.15s ease",
                  textAlign: "left", fontFamily: "inherit"
                }}
              >
                <div style={{
                  color: isActive ? "#8B5CF6" : "var(--ryn-text-muted)",
                  display: "flex", flexShrink: 0
                }}>
                  <SectionIcon />
                </div>
                <span style={{
                  fontSize: "13px", fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--ryn-text)" : "var(--ryn-text-secondary)"
                }}>
                  {section.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderSectionContent()}
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // ══  RENDER
  // ═══════════════════════════════════

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "32px",
      minHeight: "100vh",
      backgroundColor: "var(--ryn-bg)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: isMobile ? "100px" : "32px"
    }} className="fade-in">

      {/* Desktop header */}
      {!isMobile && (
        <header style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{
                fontSize: "30px", fontWeight: 800,
                background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #6D28D9 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                marginBottom: "4px", letterSpacing: "-0.5px"
              }}>Configurações</h1>
              <p style={{ fontSize: "14px", color: "var(--ryn-text-secondary)" }}>
                Gerencie seus dados e preferências do Rynance
              </p>
            </div>
            {/* Quick toggle: hide values */}
            <button onClick={toggleHideValues} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "10px",
              backgroundColor: preferences.hide_values ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${preferences.hide_values ? "rgba(139,92,246,0.3)" : "var(--ryn-border)"}`,
              color: preferences.hide_values ? "#8B5CF6" : "var(--ryn-text-secondary)",
              cursor: "pointer", fontSize: "13px", fontWeight: 500,
              fontFamily: "inherit", transition: "all 0.2s ease",
              minHeight: "44px"
            }}>
              {preferences.hide_values ? <IconEyeOff /> : <IconEye />}
              {preferences.hide_values ? "Valores ocultos" : "Ocultar valores"}
            </button>
          </div>
        </header>
      )}

      {/* Content */}
      {isMobile ? (
        activeSection ? renderSectionContent() : renderMobileMenu()
      ) : (
        renderDesktopLayout()
      )}

      <ToastPortal />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// ══  SUB-COMPONENT: Category Item
// ═══════════════════════════════════════════════════════════

function CategoryItem({ cat, isMobile, editingCat, setEditingCat, onUpdate, onDelete, transactions }) {
  const isEditing = editingCat && editingCat.id === cat.id;
  const [editName, setEditName] = useState(cat.name);
  const [editIcon, setEditIcon] = useState(cat.icon);
  const [editColor, setEditColor] = useState(cat.color);
  const txCount = transactions.filter(t => t.category === cat.name).length;

  if (isEditing) {
    return (
      <div style={{
        padding: "14px", borderRadius: "12px",
        backgroundColor: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)",
        marginBottom: "4px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" value={editName}
            onChange={e => setEditName(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", fontSize: "16px",
              backgroundColor: "var(--ryn-input)", border: "1px solid var(--ryn-border-strong)",
              borderRadius: "8px", color: "var(--ryn-text)", fontFamily: "inherit", outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {AVAILABLE_ICONS.slice(0, 10).map(icon => (
              <button key={icon} onClick={() => setEditIcon(icon)}
                style={{
                  width: "34px", height: "34px", borderRadius: "6px",
                  border: editIcon === icon ? "2px solid #8B5CF6" : "1px solid var(--ryn-border)",
                  backgroundColor: editIcon === icon ? "rgba(139,92,246,0.1)" : "transparent",
                  cursor: "pointer", fontSize: "15px", display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>{icon}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {AVAILABLE_COLORS.map(color => (
              <button key={color} onClick={() => setEditColor(color)}
                style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  backgroundColor: color,
                  border: editColor === color ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer"
                }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => onUpdate({ ...cat, name: editName, icon: editIcon, color: editColor })}
              style={{
                border: "none", borderRadius: "8px", padding: "8px 16px",
                fontSize: "12px", fontWeight: 600, cursor: "pointer",
                backgroundColor: "#8B5CF6", color: "#fff", fontFamily: "inherit",
                minHeight: "36px"
              }}>Salvar</button>
            <button onClick={() => setEditingCat(null)}
              style={{
                border: "1px solid var(--ryn-border)", borderRadius: "8px", padding: "8px 16px",
                fontSize: "12px", fontWeight: 500, cursor: "pointer",
                backgroundColor: "transparent", color: "var(--ryn-text-secondary)",
                fontFamily: "inherit", minHeight: "36px"
              }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "10px 12px", borderRadius: "10px",
      transition: "background-color 0.15s ease",
      minHeight: "48px"
    }}>
      <span style={{ fontSize: "20px", flexShrink: 0, width: "28px", textAlign: "center" }}>
        {cat.icon}
      </span>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        backgroundColor: cat.color, flexShrink: 0
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--ryn-text)" }}>
          {cat.name}
        </div>
        {txCount > 0 && (
          <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)" }}>
            {txCount} {txCount === 1 ? "movimentação" : "movimentações"}
          </div>
        )}
      </div>
      {cat.isDefault ? (
        <span style={{ fontSize: "10px", color: "var(--ryn-text-muted)", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.04)" }}>
          Padrão
        </span>
      ) : (
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => {
            setEditName(cat.name);
            setEditIcon(cat.icon);
            setEditColor(cat.color);
            setEditingCat(cat);
          }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ryn-text-muted)", padding: "8px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: "36px", minHeight: "36px"
            }}>
            <IconEdit />
          </button>
          <button onClick={() => onDelete(cat)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(239,68,68,0.7)", padding: "8px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: "36px", minHeight: "36px"
            }}>
            <IconTrash />
          </button>
        </div>
      )}
    </div>
  );
}
