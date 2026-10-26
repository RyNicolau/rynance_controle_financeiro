import React, { useState, useEffect, useMemo } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../lib/supabase";
import {
  PRESET_SUBSCRIPTIONS,
  SUBSCRIPTION_CATEGORIES,
  PAYMENT_METHODS,
  BILLING_CYCLES,
  getPresetById,
  renderSubscriptionIcon
} from "../data/subscriptionPresets";
import { formatMoneyInput, parseMoneyToNumber, handleMoneyInputChange } from "../utils/currencyMask";

// Formata moeda BRL
const formatBRL = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Calcula a próxima data de cobrança e dias restantes
const getNextBillingInfo = (billingDay, billingCycle = "monthly") => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const day = Math.min(Math.max(Number(billingDay) || 1, 1), 31);

  // Calcula próxima data no mês atual
  let nextDate = new Date(currentYear, currentMonth, day);
  
  // Se já passou o dia neste mês (hoje é posterior ao dia de cobrança)
  const todayMidnight = new Date(currentYear, currentMonth, today.getDate());
  if (nextDate < todayMidnight) {
    nextDate = new Date(currentYear, currentMonth + 1, day);
  }

  // Diferença em dias
  const diffTime = nextDate - todayMidnight;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = nextDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });

  return {
    nextDate,
    diffDays,
    formattedDate
  };
};

// Calcula custo equivalente mensal
const getMonthlyEquivalent = (price, cycle) => {
  const num = Number(price) || 0;
  switch (cycle) {
    case "yearly":
      return num / 12;
    case "quarterly":
      return num / 3;
    case "semiannual":
      return num / 6;
    case "weekly":
      return num * 4.33;
    case "monthly":
    default:
      return num;
  }
};

// Subscrições padrão para novos usuários
const DEFAULT_INITIAL_SUBS = [
  {
    id: "sub_demo_netflix",
    name: "Netflix",
    preset_id: "netflix",
    category: "Streaming Vídeo",
    price: 44.90,
    billing_cycle: "monthly",
    billing_day: 15,
    payment_method: "Cartão de Crédito",
    status: "active",
    plan_name: "Padrão (1080p)",
    color: "#E50914",
    notes: ""
  },
  {
    id: "sub_demo_spotify",
    name: "Spotify",
    preset_id: "spotify",
    category: "Música & Áudio",
    price: 21.90,
    billing_cycle: "monthly",
    billing_day: 8,
    payment_method: "Cartão de Crédito",
    status: "active",
    plan_name: "Premium Individual",
    color: "#1DB954",
    notes: ""
  },
  {
    id: "sub_demo_google",
    name: "Google One",
    preset_id: "google-one",
    category: "Nuvem & Armazenamento",
    price: 9.99,
    billing_cycle: "monthly",
    billing_day: 22,
    payment_method: "Pix Automático",
    status: "active",
    plan_name: "Básico 100 GB",
    color: "#4285F4",
    notes: "Fotos e Gmail"
  }
];

export default function Subscriptions({ user, onAddTransaction }) {
  const isMobile = useIsMobile();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros e ordenação
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, paused
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("due"); // due, price-desc, price-asc, name

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPresetId, setFormPresetId] = useState("");
  const [formPlanName, setFormPlanName] = useState("");
  const [formCategory, setFormCategory] = useState("Streaming Vídeo");
  const [formPrice, setFormPrice] = useState("");
  const [formCycle, setFormCycle] = useState("monthly");
  const [formBillingDay, setFormBillingDay] = useState(1);
  const [formPaymentMethod, setFormPaymentMethod] = useState("Cartão de Crédito");
  const [formStatus, setFormStatus] = useState("active");
  const [formNotes, setFormNotes] = useState("");
  const [formColor, setFormColor] = useState("#8B5CF6");
  const [formError, setFormError] = useState("");

  const storageKey = `ryn_subscriptions_${user?.id || "guest"}`;

  // Carregar assinaturas (Supabase com fallback LocalStorage)
  useEffect(() => {
    let isMounted = true;

    const loadSubscriptions = async () => {
      setLoading(true);
      let loaded = null;

      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data && data.length > 0) {
            loaded = data.map((item) => ({
              id: item.id,
              user_id: item.user_id,
              name: item.name,
              preset_id: item.preset_id,
              plan_name: item.plan_name || "",
              category: item.category,
              price: Number(item.price) || 0,
              billing_cycle: item.billing_cycle || "monthly",
              billing_day: Number(item.billing_day) || 1,
              payment_method: item.payment_method || "Cartão de Crédito",
              status: item.status || "active",
              color: item.color || "#8B5CF6",
              notes: item.notes || ""
            }));
          }
        } catch {
          // Supabase table pode não existir ainda
        }
      }

      // Se não achou no Supabase, tenta carregar do localStorage
      if (!loaded) {
        try {
          const localData = localStorage.getItem(storageKey);
          if (localData) {
            loaded = JSON.parse(localData);
          }
        } catch {
          // ignore
        }
      }

      // Se ainda vazio, usa os defaults pré-configurados
      if (!loaded || loaded.length === 0) {
        loaded = DEFAULT_INITIAL_SUBS;
        try {
          localStorage.setItem(storageKey, JSON.stringify(loaded));
        } catch {
          // ignore
        }
      }

      if (isMounted) {
        setSubscriptions(loaded);
        setLoading(false);
      }
    };

    loadSubscriptions();

    return () => {
      isMounted = false;
    };
  }, [user?.id, storageKey]);

  // Salvar no estado, localStorage e Supabase
  const persistSubscriptions = async (updatedList) => {
    setSubscriptions(updatedList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    if (user?.id) {
      try {
        // Tenta sincronizar com Supabase
        const rows = updatedList.map((sub) => ({
          id: sub.id,
          user_id: user.id,
          name: sub.name,
          preset_id: sub.preset_id || null,
          plan_name: sub.plan_name || null,
          category: sub.category,
          price: Number(sub.price),
          billing_cycle: sub.billing_cycle,
          billing_day: Number(sub.billing_day),
          payment_method: sub.payment_method,
          status: sub.status,
          color: sub.color,
          notes: sub.notes
        }));

        // Remove os excluídos
        await supabase.from("subscriptions").delete().eq("user_id", user.id);
        if (rows.length > 0) {
          await supabase.from("subscriptions").upsert(rows);
        }
      } catch {
        // Tabela Supabase pode não existir
      }
    }
  };

  // Abrir Modal para criar nova assinatura
  const handleOpenAddModal = (preset = null) => {
    setEditingSub(null);
    setFormError("");

    if (preset) {
      setSelectedPreset(preset);
      setFormName(preset.name);
      setFormPresetId(preset.id);
      setFormCategory(preset.category);
      setFormPrice(formatMoneyInput(preset.defaultPrice));
      setFormPlanName(preset.suggestedPlans?.[0]?.name || "");
      setFormColor(preset.color);
    } else {
      setSelectedPreset(null);
      setFormName("");
      setFormPresetId("");
      setFormCategory("Streaming Vídeo");
      setFormPrice("");
      setFormPlanName("");
      setFormColor("#8B5CF6");
    }

    setFormCycle("monthly");
    setFormBillingDay(new Date().getDate());
    setFormPaymentMethod("Cartão de Crédito");
    setFormStatus("active");
    setFormNotes("");
    setModalOpen(true);
  };

  // Abrir Modal para editar
  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setFormError("");
    const preset = sub.preset_id ? getPresetById(sub.preset_id) : null;
    setSelectedPreset(preset);

    setFormName(sub.name);
    setFormPresetId(sub.preset_id || "");
    setFormPlanName(sub.plan_name || "");
    setFormCategory(sub.category);
    setFormPrice(formatMoneyInput(sub.price));
    setFormCycle(sub.billing_cycle || "monthly");
    setFormBillingDay(sub.billing_day || 1);
    setFormPaymentMethod(sub.payment_method || "Cartão de Crédito");
    setFormStatus(sub.status || "active");
    setFormColor(sub.color || "#8B5CF6");
    setFormNotes(sub.notes || "");
    setModalOpen(true);
  };

  // Selecionar preset dentro do modal
  const handleSelectPresetInModal = (preset) => {
    setSelectedPreset(preset);
    setFormName(preset.name);
    setFormPresetId(preset.id);
    setFormCategory(preset.category);
    setFormPrice(formatMoneyInput(preset.defaultPrice));
    setFormPlanName(preset.suggestedPlans?.[0]?.name || "");
    setFormColor(preset.color);
  };

  // Salvar formulário
  const handleSaveModal = async () => {
    if (!formName.trim()) {
      setFormError("Informe o nome do serviço.");
      return;
    }

    const cleanPrice = parseMoneyToNumber(formPrice);
    if (cleanPrice <= 0) {
      setFormError("Informe um valor válido maior que zero.");
      return;
    }

    const day = parseInt(formBillingDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setFormError("O dia de cobrança deve ser entre 1 e 31.");
      return;
    }

    const subData = {
      name: formName.trim(),
      preset_id: formPresetId || null,
      plan_name: formPlanName.trim(),
      category: formCategory,
      price: cleanPrice,
      billing_cycle: formCycle,
      billing_day: day,
      payment_method: formPaymentMethod,
      status: formStatus,
      color: formColor || "#8B5CF6",
      notes: formNotes.trim()
    };

    let updatedList;
    if (editingSub) {
      updatedList = subscriptions.map((s) =>
        s.id === editingSub.id ? { ...s, ...subData } : s
      );
    } else {
      const newSub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...subData
      };
      updatedList = [newSub, ...subscriptions];
    }

    await persistSubscriptions(updatedList);
    setModalOpen(false);
  };

  // Alternar status (Ativa <-> Pausada)
  const handleToggleStatus = async (subId) => {
    const updatedList = subscriptions.map((s) => {
      if (s.id === subId) {
        return {
          ...s,
          status: s.status === "active" ? "paused" : "active"
        };
      }
      return s;
    });
    await persistSubscriptions(updatedList);
  };

  // Excluir assinatura
  const handleDeleteSub = async (subId, subName) => {
    if (window.confirm(`Tem certeza que deseja excluir a assinatura "${subName}"?`)) {
      const updatedList = subscriptions.filter((s) => s.id !== subId);
      await persistSubscriptions(updatedList);
    }
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === "active");

    // Total mensal equivalente
    const monthlyTotal = activeSubs.reduce(
      (sum, s) => sum + getMonthlyEquivalent(s.price, s.billing_cycle),
      0
    );

    // Total anual estimado
    const yearlyTotal = monthlyTotal * 12;

    // Próxima cobrança mais urgente
    const sortedUpcoming = [...activeSubs]
      .map((s) => {
        const info = getNextBillingInfo(s.billing_day, s.billing_cycle);
        return { ...s, ...info };
      })
      .sort((a, b) => a.diffDays - b.diffDays);

    const nextBilling = sortedUpcoming[0] || null;

    return {
      monthlyTotal,
      yearlyTotal,
      activeCount: activeSubs.length,
      pausedCount: subscriptions.length - activeSubs.length,
      nextBilling
    };
  }, [subscriptions]);

  // Lista filtrada e ordenada
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => {
        // Filtro de status
        if (statusFilter === "active" && s.status !== "active") return false;
        if (statusFilter === "paused" && s.status !== "paused") return false;

        // Filtro de categoria
        if (selectedCategory !== "all" && s.category !== selectedCategory) return false;

        // Busca
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchPlan = (s.plan_name || "").toLowerCase().includes(q);
          const matchNotes = (s.notes || "").toLowerCase().includes(q);
          if (!matchName && !matchPlan && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "due") {
          const aInfo = getNextBillingInfo(a.billing_day, a.billing_cycle);
          const bInfo = getNextBillingInfo(b.billing_day, b.billing_cycle);
          return aInfo.diffDays - bInfo.diffDays;
        }
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [subscriptions, statusFilter, selectedCategory, searchQuery, sortBy]);

  // Estilos
  const styles = {
    container: {
      padding: isMobile ? "20px 16px" : "32px",
      minHeight: "100vh",
      backgroundColor: "var(--ryn-bg)",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    header: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: "16px",
      marginBottom: "28px"
    },
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
    subtitle: {
      fontSize: "14px",
      color: "var(--ryn-text-secondary)"
    },
    addBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "#8B5CF6",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "12px",
      padding: isMobile ? "10px 16px" : "12px 20px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
      transition: "all 0.2s ease"
    },
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: "14px",
      marginBottom: "28px"
    },
    kpiCard: {
      backgroundColor: "var(--ryn-card)",
      border: "1px solid var(--ryn-border)",
      borderRadius: "16px",
      padding: "18px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
    },
    kpiLabel: {
      fontSize: "11px",
      fontWeight: 600,
      color: "var(--ryn-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px"
    },
    kpiValue: {
      fontSize: isMobile ? "18px" : "22px",
      fontWeight: 800,
      color: "var(--ryn-text)",
      fontFamily: "'IBM Plex Mono', monospace"
    },
    presetSection: {
      backgroundColor: "var(--ryn-card)",
      border: "1px solid var(--ryn-border)",
      borderRadius: "18px",
      padding: "20px",
      marginBottom: "28px"
    },
    presetHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px"
    },
    presetTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: "var(--ryn-text)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      letterSpacing: "-0.2px"
    },
    presetScroll: {
      display: "flex",
      gap: "10px",
      overflowX: "auto",
      paddingBottom: "8px",
      scrollbarWidth: "thin"
    },
    presetBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: "rgba(139, 92, 246, 0.05)",
      border: "1px solid var(--ryn-border)",
      borderRadius: "12px",
      padding: "8px 14px",
      cursor: "pointer",
      color: "var(--ryn-text)",
      fontSize: "13px",
      fontWeight: 600,
      flexShrink: 0,
      transition: "all 0.15s ease",
      whiteSpace: "nowrap"
    },
    filterBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px"
    },
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "16px"
    }
  };

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Assinaturas</h1>
          <p style={styles.subtitle}>
            Monitore Netflix, Google, Spotify e outros serviços recorrentes com facilidade.
          </p>
        </div>
        <button
          onClick={() => handleOpenAddModal(null)}
          style={styles.addBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.4)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Assinatura
        </button>
      </div>

      {/* Cards de Métricas (KPIs) */}
      <div style={styles.kpiGrid}>
        {/* Total Mensal */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Custo Mensal Total</div>
          <div style={{ ...styles.kpiValue, color: "#8B5CF6" }}>
            {formatBRL(metrics.monthlyTotal)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)", marginTop: "4px" }}>
            Equivalente por mês
          </div>
        </div>

        {/* Previsão Anual */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Previsão Anual</div>
          <div style={styles.kpiValue}>{formatBRL(metrics.yearlyTotal)}</div>
          <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)", marginTop: "4px" }}>
            Total em 12 meses
          </div>
        </div>

        {/* Assinaturas Ativas */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Serviços Ativos</div>
          <div style={{ ...styles.kpiValue, color: "#10B981" }}>
            {metrics.activeCount}
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ryn-text-muted)", marginLeft: "6px" }}>
              ativas
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)", marginTop: "4px" }}>
            {metrics.pausedCount > 0 ? `${metrics.pausedCount} pausada(s)` : "Todas ativas"}
          </div>
        </div>

        {/* Próxima Cobrança */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Próximo Vencimento</div>
          {metrics.nextBilling ? (
            <>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--ryn-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {metrics.nextBilling.name}
              </div>
              <div style={{ fontSize: "12px", color: metrics.nextBilling.diffDays <= 3 ? "#EF4444" : "#F59E0B", fontWeight: 700, marginTop: "4px" }}>
                {metrics.nextBilling.diffDays === 0
                  ? "Vence Hoje!"
                  : metrics.nextBilling.diffDays === 1
                  ? "Vence Amanhã"
                  : `Em ${metrics.nextBilling.diffDays} dias (${metrics.nextBilling.formattedDate})`}
                {" • "}
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatBRL(metrics.nextBilling.price)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "13px", color: "var(--ryn-text-muted)", marginTop: "4px" }}>
              Nenhuma assinatura ativa
            </div>
          )}
        </div>
      </div>

      {/* Seção de Adição Rápida com Ícones Originais */}
      <div style={styles.presetSection}>
        <div style={styles.presetHeader}>
          <div style={styles.presetTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Adicionar Rápido com Ícone Original
          </div>
          <span style={{ fontSize: "11px", color: "var(--ryn-text-muted)" }}>
            Clique para cadastrar
          </span>
        </div>
        <div style={styles.presetScroll}>
          {PRESET_SUBSCRIPTIONS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleOpenAddModal(preset)}
              style={styles.presetBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.15)";
                e.currentTarget.style.borderColor = "#8B5CF6";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.05)";
                e.currentTarget.style.borderColor = "var(--ryn-border)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {preset.renderLogo({ size: 22 })}
              </div>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Filtros, Busca e Ordenação */}
      <div style={styles.filterBar}>
        {/* Status Pills */}
        <div style={{ display: "flex", gap: "6px", backgroundColor: "var(--ryn-card)", padding: "4px", borderRadius: "10px", border: "1px solid var(--ryn-border)" }}>
          {[
            { id: "all", label: "Todas" },
            { id: "active", label: "Ativas" },
            { id: "paused", label: "Pausadas" }
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  background: active ? "#8B5CF6" : "transparent",
                  color: active ? "#FFFFFF" : "var(--ryn-text-muted)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Busca & Categoria & Ordenação */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: isMobile ? "1 1 100%" : "none" }}>
          {/* Input de Busca */}
          <div style={{ position: "relative", minWidth: isMobile ? "100%" : "200px" }}>
            <input
              type="text"
              placeholder="Buscar assinatura..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                backgroundColor: "var(--ryn-card)",
                border: "1px solid var(--ryn-border)",
                borderRadius: "10px",
                color: "var(--ryn-text)",
                fontSize: "13px",
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ryn-text-muted)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: "10px", top: "11px" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Select de Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--ryn-card)",
              border: "1px solid var(--ryn-border)",
              borderRadius: "10px",
              color: "var(--ryn-text)",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <option value="all">Todas Categorias</option>
            {SUBSCRIPTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--ryn-card)",
              border: "1px solid var(--ryn-border)",
              borderRadius: "10px",
              color: "var(--ryn-text)",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            <option value="due">Próximo Vencimento</option>
            <option value="price-desc">Maior Valor</option>
            <option value="price-asc">Menor Valor</option>
            <option value="name">Nome A-Z</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards de Assinaturas */}
      {filteredSubscriptions.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--ryn-card)",
            border: "1px dashed var(--ryn-border-strong)",
            borderRadius: "20px",
            padding: "48px 24px",
            textAlign: "center",
            marginTop: "16px"
          }}
        >
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", backgroundColor: "rgba(139, 92, 246, 0.1)", marginBottom: "16px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--ryn-text)", marginBottom: "6px" }}>
            Nenhuma assinatura encontrada
          </div>
          <div style={{ fontSize: "13px", color: "var(--ryn-text-muted)", marginBottom: "20px", maxWidth: "400px", margin: "0 auto 20px" }}>
            {searchQuery || selectedCategory !== "all" || statusFilter !== "all"
              ? "Tente ajustar os filtros ou busca."
              : "Cadastre suas assinaturas mensais ou anuais para controlar seus gastos fixos."}
          </div>
          <button onClick={() => handleOpenAddModal(null)} style={styles.addBtn}>
            + Adicionar Assinatura
          </button>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {filteredSubscriptions.map((sub) => {
            const isPaused = sub.status === "paused";
            const billingInfo = getNextBillingInfo(sub.billing_day, sub.billing_cycle);
            const cycleObj = BILLING_CYCLES.find((c) => c.id === sub.billing_cycle) || BILLING_CYCLES[0];
            const monthlyEquiv = getMonthlyEquivalent(sub.price, sub.billing_cycle);

            return (
              <div
                key={sub.id}
                style={{
                  backgroundColor: "var(--ryn-card)",
                  border: isPaused ? "1px solid var(--ryn-border)" : "1px solid var(--ryn-border-strong)",
                  borderRadius: "18px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isPaused ? 0.65 : 1,
                  position: "relative",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(139, 92, 246, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = isPaused ? "var(--ryn-border)" : "var(--ryn-border-strong)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.12)";
                }}
              >
                <div>
                  {/* Topo do Card: Ícone Original + Título + Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid var(--ryn-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 4px 14px ${sub.color || "#8B5CF6"}25`,
                          overflow: "hidden",
                          flexShrink: 0
                        }}
                      >
                        {renderSubscriptionIcon(sub, 34)}
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--ryn-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                          {sub.name}
                          {isPaused && (
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", backgroundColor: "rgba(100, 116, 139, 0.2)", color: "var(--ryn-text-muted)", fontWeight: 600 }}>
                              Pausada
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", marginTop: "2px" }}>
                          {sub.plan_name || sub.category}
                        </div>
                      </div>
                    </div>

                    {/* Preço */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--ryn-text)", fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatBRL(sub.price)}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ryn-text-muted)" }}>
                        /{cycleObj.text}
                      </div>
                    </div>
                  </div>

                  {/* Informações de Cobrança */}
                  <div
                    style={{
                      backgroundColor: "rgba(139, 92, 246, 0.04)",
                      border: "1px solid var(--ryn-border)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      marginBottom: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--ryn-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Cobrança
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ryn-text)", marginTop: "2px" }}>
                        Todo dia {sub.billing_day}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", color: "var(--ryn-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Próxima
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: isPaused
                            ? "var(--ryn-text-muted)"
                            : billingInfo.diffDays <= 3
                            ? "#EF4444"
                            : billingInfo.diffDays <= 7
                            ? "#F59E0B"
                            : "#8B5CF6",
                          marginTop: "2px"
                        }}
                      >
                        {isPaused
                          ? "Suspensa"
                          : billingInfo.diffDays === 0
                          ? "Vence Hoje!"
                          : billingInfo.diffDays === 1
                          ? "Amanhã"
                          : `Em ${billingInfo.diffDays} dias`}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes extras: Categoria e Forma de Pagamento */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "rgba(139, 92, 246, 0.1)",
                        color: "#A78BFA",
                        padding: "3px 8px",
                        borderRadius: "6px"
                      }}
                    >
                      {sub.category}
                    </span>

                    {sub.payment_method && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          color: "var(--ryn-text-secondary)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        {sub.payment_method}
                      </span>
                    )}

                    {sub.billing_cycle !== "monthly" && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          color: "#10B981",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        Equiv. {formatBRL(monthlyEquiv)}/mês
                      </span>
                    )}
                  </div>

                  {sub.notes && (
                    <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", fontStyle: "italic", marginBottom: "12px" }}>
                      "{sub.notes}"
                    </div>
                  )}
                </div>

                {/* Rodapé do Card: Ações */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--ryn-border)"
                  }}
                >
                  <button
                    onClick={() => handleToggleStatus(sub.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isPaused ? "#10B981" : "var(--ryn-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      borderRadius: "6px"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {isPaused ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Reativar
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        Pausar
                      </>
                    )}
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    {/* Botão Editar */}
                    <button
                      onClick={() => handleOpenEditModal(sub)}
                      title="Editar assinatura"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ryn-text-muted)",
                        padding: "6px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#8B5CF6";
                        e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--ryn-text-muted)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>

                    {/* Botão Excluir */}
                    <button
                      onClick={() => handleDeleteSub(sub.id, sub.name)}
                      title="Excluir assinatura"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ryn-text-muted)",
                        padding: "6px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#EF4444";
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--ryn-text-muted)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Adicionar / Editar Assinatura */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--ryn-card)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "20px",
              padding: isMobile ? "20px" : "28px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--ryn-text)" }}>
                {editingSub ? "Editar Assinatura" : "Nova Assinatura"}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ryn-text-muted)",
                  padding: "6px",
                  borderRadius: "8px"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Presets Rápidos */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "block" }}>
                Escolha um serviço popular (ou digite personalizado)
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                  gap: "8px",
                  maxHeight: "140px",
                  overflowY: "auto",
                  padding: "4px",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "12px",
                  border: "1px solid var(--ryn-border)"
                }}
              >
                {PRESET_SUBSCRIPTIONS.map((preset) => {
                  const isSelected = formPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetInModal(preset)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 4px",
                        borderRadius: "10px",
                        backgroundColor: isSelected ? "rgba(139, 92, 246, 0.25)" : "transparent",
                        border: isSelected ? "1.5px solid #8B5CF6" : "1px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {preset.renderLogo({ size: 24 })}
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: isSelected ? "#FFFFFF" : "var(--ryn-text-secondary)",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "60px"
                        }}
                      >
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Planos Sugeridos pelo Preset Selecionado */}
            {selectedPreset?.suggestedPlans && (
              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>
                  Planos sugeridos ({selectedPreset.name})
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {selectedPreset.suggestedPlans.map((plan, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormPlanName(plan.name);
                        setFormPrice(formatMoneyInput(plan.price));
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        backgroundColor: formPlanName === plan.name ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.04)",
                        border: formPlanName === plan.name ? "1px solid #8B5CF6" : "1px solid var(--ryn-border)",
                        color: formPlanName === plan.name ? "#A78BFA" : "var(--ryn-text-secondary)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {plan.name} • {formatBRL(plan.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Linha 1: Nome e Plano */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Netflix, Google..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Plano (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Padrão, Família, 2 TB..."
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              {/* Linha 2: Valor e Ciclo */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formPrice}
                    onChange={(e) => handleMoneyInputChange(e, setFormPrice)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Frequência
                  </label>
                  <select
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px"
                    }}
                  >
                    {BILLING_CYCLES.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 3: Dia de Cobrança e Categoria */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Dia de Cobrança (1 - 31) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formBillingDay}
                    onChange={(e) => setFormBillingDay(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px"
                    }}
                  >
                    {SUBSCRIPTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 4: Forma de Pagamento e Status */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Forma de Pagamento
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px"
                    }}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "rgba(139, 92, 246, 0.06)",
                      border: "1.5px solid var(--ryn-border-strong)",
                      borderRadius: "10px",
                      color: "var(--ryn-text)",
                      fontSize: "14px"
                    }}
                  >
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                  </select>
                </div>
              </div>

              {/* Linha 5: Observações */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px", display: "block" }}>
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dividido com o amigo, renovação automática..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "rgba(139, 92, 246, 0.06)",
                    border: "1.5px solid var(--ryn-border-strong)",
                    borderRadius: "10px",
                    color: "var(--ryn-text)",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Mensagem de Erro */}
              {formError && (
                <div style={{ color: "#EF4444", fontSize: "12px", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              {/* Botão de Salvar */}
              <button
                type="button"
                onClick={handleSaveModal}
                style={{
                  marginTop: "10px",
                  padding: "14px",
                  background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(109, 40, 217, 0.4)",
                  transition: "all 0.15s ease"
                }}
              >
                {editingSub ? "Salvar Alterações" : "Adicionar Assinatura"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
