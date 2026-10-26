import React, { useState } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { EXPENSE_CATEGORIES } from "../data/demoData";
import { formatMoneyInput, parseMoneyToNumber, handleMoneyInputChange } from "../utils/currencyMask";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const CATEGORY_ICONS = {
  "Alimentação": "🍽️",
  "Transporte": "🚗",
  "Moradia": "🏠",
  "Saúde": "💊",
  "Lazer": "🎮",
  "Educação": "📚",
  "Vestuário": "👕",
  "Assinaturas": "📱",
  "Outros": "📦"
};

const getMonthFromDate = (dateStr) => {
  const parts = dateStr.split("-");
  return Number(parts[1]) - 1;
};

const getYearFromDate = (dateStr) => {
  const parts = dateStr.split("-");
  return Number(parts[0]);
};

export default function Budget({
  transactions,
  budgets,
  setBudgets,
  currentMonth,
  setCurrentMonth,
  currentYear
}) {
  const isMobile = useIsMobile();
  const [hoveredPill, setHoveredPill] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

  const monthTransactions = transactions.filter(
    (tx) =>
      getMonthFromDate(tx.date) === currentMonth &&
      getYearFromDate(tx.date) === currentYear
  );

  const monthExpenses = monthTransactions.filter((t) => t.type === "expense");

  const formatCurrency = (val) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getCategorySpending = (category) =>
    monthExpenses
      .filter((t) => t.category === category)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleSetBudget = (category) => {
    const val = parseMoneyToNumber(inputValue);
    if (val < 0) {
      setEditingCategory(null);
      setInputValue("");
      return;
    }
    const updated = { ...budgets, [category]: val };
    setBudgets(updated);
    setEditingCategory(null);
    setInputValue("");
  };

  const handleRemoveBudget = (category) => {
    const updated = { ...budgets };
    delete updated[category];
    setBudgets(updated);
  };

  const totalBudget = EXPENSE_CATEGORIES.reduce(
    (acc, cat) => acc + (budgets[cat] || 0),
    0
  );
  const totalSpent = EXPENSE_CATEGORIES.reduce(
    (acc, cat) => acc + getCategorySpending(cat),
    0
  );
  const totalRemaining = totalBudget - totalSpent;
  const categoriesOverBudget = EXPENSE_CATEGORIES.filter((cat) => {
    const budget = budgets[cat];
    if (!budget) return false;
    return getCategorySpending(cat) > budget;
  });

  const styles = {
    container: {
      padding: isMobile ? "20px 16px" : "32px",
      minHeight: "100vh",
      backgroundColor: "var(--ryn-bg)",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    header: { marginBottom: "24px" },
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
    pillsContainer: {
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      paddingBottom: "12px",
      marginBottom: "28px",
      scrollbarWidth: "thin",
      WebkitOverflowScrolling: "touch"
    },
    pill: (isActive, isHovered) => ({
      padding: "8px 16px",
      borderRadius: "20px",
      border: "1px solid var(--ryn-border)",
      backgroundColor: isActive
        ? "rgba(139, 92, 246, 0.12)"
        : isHovered
        ? "rgba(255, 255, 255, 0.04)"
        : "var(--ryn-card)",
      color: isActive ? "#8B5CF6" : isHovered ? "var(--ryn-text)" : "var(--ryn-text-secondary)",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
      outline: "none",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }),
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(140px, 1fr))" : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "28px"
    },
    summaryCard: (isHovered, accentColor) => ({
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      padding: isMobile ? "14px 16px" : "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      transform: isHovered ? "translateY(-4px)" : "none",
      boxShadow: isHovered
        ? "0 16px 32px -8px rgba(109, 40, 217, 0.25)"
        : "0 2px 12px rgba(0,0,0,0.12)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      borderLeft: accentColor ? `3px solid ${accentColor}` : undefined
    }),
    summaryLabel: {
      fontSize: "11px",
      color: "var(--ryn-text-secondary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    summaryValue: {
      fontSize: isMobile ? "18px" : "22px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace"
    },
    alertBanner: {
      backgroundColor: "var(--ryn-red-bg)",
      border: "1px solid rgba(239, 68, 68, 0.2)",
      borderRadius: "10px",
      padding: "14px 20px",
      marginBottom: "24px",
      fontSize: "13px",
      color: "var(--ryn-red)",
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    categoryGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(240px, 1fr))" : "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "16px"
    },
    categoryCard: (isHovered, isOver) => ({
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${isOver ? "rgba(239, 68, 68, 0.25)" : "var(--ryn-glass-border)"}`,
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      transform: isHovered ? "translateY(-2px)" : "none",
      boxShadow: isHovered
        ? "0 16px 32px -8px rgba(109, 40, 217, 0.25)"
        : "0 2px 12px rgba(0,0,0,0.12)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }),
    categoryHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    categoryName: {
      fontSize: "15px",
      fontWeight: 600,
      color: "var(--ryn-text)",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    spendingRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "13px"
    },
    editInput: {
      backgroundColor: "var(--ryn-input)",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      borderRadius: "6px",
      padding: "6px 10px",
      color: "var(--ryn-text)",
      fontSize: "14px",
      fontFamily: "'IBM Plex Mono', monospace",
      width: "120px",
      outline: "none"
    },
    actionBtn: (variant) => ({
      border: "none",
      borderRadius: "6px",
      padding: "7px 14px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor:
        variant === "green"
          ? "rgba(139, 92, 246, 0.15)"
          : variant === "red"
          ? "rgba(239, 68, 68, 0.10)"
          : "rgba(255,255,255,0.05)",
      color:
        variant === "green"
          ? "#8B5CF6"
          : variant === "red"
          ? "var(--ryn-red)"
          : "var(--ryn-text-muted)"
    }),
    noBudgetBtn: {
      background: "none",
      border: "1px dashed var(--ryn-border-strong)",
      borderRadius: "8px",
      color: "var(--ryn-text-muted)",
      padding: "8px 14px",
      fontSize: "12px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s ease",
      width: "100%",
      textAlign: "center",
      outline: "none"
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <header style={styles.header}>
        <h1 style={styles.title}>Orçamento</h1>
        <p style={styles.subtitle}>
          Defina limites de gasto por categoria e acompanhe em tempo real
        </p>
      </header>

      {/* Month Selector Pills */}
      <div style={styles.pillsContainer}>
        {MONTHS.map((month, idx) => {
          const isActive = currentMonth === idx;
          const isHovered = hoveredPill === idx;
          return (
            <button
              key={idx}
              onClick={() => setCurrentMonth(idx)}
              onMouseEnter={() => setHoveredPill(idx)}
              onMouseLeave={() => setHoveredPill(null)}
              style={styles.pill(isActive, isHovered)}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div
          onMouseEnter={() => setHoveredCard("budget")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.summaryCard(hoveredCard === "budget", "#8B5CF6")}
        >
          <span style={styles.summaryLabel}>Orçamento Total</span>
          <span style={{ ...styles.summaryValue, color: "#8B5CF6" }}>
            {totalBudget > 0 ? formatCurrency(totalBudget) : "Não definido"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--ryn-text-secondary)" }}>
            Limite mensal configurado
          </span>
        </div>

        <div
          onMouseEnter={() => setHoveredCard("spent")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.summaryCard(hoveredCard === "spent", "var(--ryn-red)")}
        >
          <span style={styles.summaryLabel}>Total Gasto</span>
          <span style={{ ...styles.summaryValue, color: "var(--ryn-red)" }}>
            {formatCurrency(totalSpent)}
          </span>
          <span style={{ fontSize: "12px", color: "var(--ryn-text-secondary)" }}>
            {totalBudget > 0
              ? `${((totalSpent / totalBudget) * 100).toFixed(1).replace(".", ",")}% do orçamento`
              : "Sem limite definido"}
          </span>
        </div>

        <div
          onMouseEnter={() => setHoveredCard("remaining")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.summaryCard(
            hoveredCard === "remaining",
            totalBudget > 0 ? (totalRemaining >= 0 ? "#4ade80" : "var(--ryn-red)") : undefined
          )}
        >
          <span style={styles.summaryLabel}>Disponível no Orçamento</span>
          <span
            style={{
              ...styles.summaryValue,
              color:
                totalBudget > 0
                  ? totalRemaining >= 0
                    ? "#4ade80"
                    : "var(--ryn-red)"
                  : "#64748b"
            }}
          >
            {totalBudget > 0 ? formatCurrency(totalRemaining) : "—"}
          </span>
          <span
            style={{
              fontSize: "12px",
              color:
                totalBudget > 0
                  ? totalRemaining >= 0
                    ? "#22c55e"
                    : "var(--ryn-red)"
                  : "var(--ryn-text-secondary)"
            }}
          >
            {totalBudget > 0
              ? totalRemaining >= 0
                ? "Dentro do limite ✓"
                : "⚠️ Orçamento excedido"
              : "Configure categorias abaixo"}
          </span>
        </div>

        <div
          onMouseEnter={() => setHoveredCard("alert")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.summaryCard(
            hoveredCard === "alert",
            categoriesOverBudget.length > 0 ? "var(--ryn-red)" : "#4ade80"
          )}
        >
          <span style={styles.summaryLabel}>Status</span>
          <span
            style={{
              ...styles.summaryValue,
              color: categoriesOverBudget.length > 0 ? "var(--ryn-red)" : "#22c55e"
            }}
          >
            {categoriesOverBudget.length > 0
              ? `${categoriesOverBudget.length} excedida${categoriesOverBudget.length > 1 ? "s" : ""}`
              : "✓ Tudo ok"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--ryn-text-secondary)" }}>
            {categoriesOverBudget.length > 0
              ? categoriesOverBudget.join(", ")
              : "Nenhuma categoria excedida"}
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      {categoriesOverBudget.length > 0 && (
        <div style={styles.alertBanner}>
          <span>⚠️</span>
          <span>
            <strong>
              {categoriesOverBudget.length}{" "}
              {categoriesOverBudget.length === 1 ? "categoria" : "categorias"}
            </strong>{" "}
            ultrapassaram o limite em {MONTHS[currentMonth]}:{" "}
            {categoriesOverBudget.join(", ")}
          </span>
        </div>
      )}

      {/* Category Budget Cards */}
      <div style={styles.categoryGrid}>
        {EXPENSE_CATEGORIES.map((category) => {
          const spent = getCategorySpending(category);
          const budget = budgets[category] || 0;
          const percent = budget > 0 ? (spent / budget) * 100 : 0;
          const isOver = budget > 0 && spent > budget;
          const isWarning = budget > 0 && !isOver && percent > 75;
          const isHovered = hoveredCard === `cat-${category}`;
          const isEditing = editingCategory === category;

          const progressColor = isOver
            ? "var(--ryn-red)"
            : isWarning
            ? "#fb923c"
            : "#22c55e";

          return (
            <div
              key={category}
              onMouseEnter={() => setHoveredCard(`cat-${category}`)}
              onMouseLeave={() => setHoveredCard(null)}
              style={styles.categoryCard(isHovered, isOver)}
            >
              {/* Header */}
              <div style={styles.categoryHeader}>
                <span style={styles.categoryName}>
                  <span style={{ fontSize: "18px" }}>
                    {CATEGORY_ICONS[category] || "📌"}
                  </span>
                  {category}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isOver && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        backgroundColor: "var(--ryn-red-bg)",
                        color: "var(--ryn-red)",
                        borderRadius: "10px",
                        fontWeight: 600
                      }}
                    >
                      Excedido
                    </span>
                  )}
                  {isWarning && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        backgroundColor: "rgba(251,146,60,0.12)",
                        color: "#fb923c",
                        borderRadius: "10px",
                        fontWeight: 600
                      }}
                    >
                      Atenção
                    </span>
                  )}
                </div>
              </div>

              {/* Spending Info */}
              <div style={styles.spendingRow}>
                <span style={{ color: "var(--ryn-text-secondary)" }}>Gasto neste mês:</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    color: isOver ? "var(--ryn-red)" : "var(--ryn-text)",
                    fontSize: "15px"
                  }}
                >
                  {formatCurrency(spent)}
                </span>
              </div>

              {/* Progress Bar */}
              {budget > 0 && (
                <>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: progressColor,
                        borderRadius: "3px",
                        transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: `0 0 6px ${progressColor}55`
                      }}
                    />
                  </div>
                  <div style={styles.spendingRow}>
                    <span style={{ color: "var(--ryn-text-secondary)", fontSize: "12px" }}>
                      {percent > 100
                        ? `${(percent - 100).toFixed(1).replace(".", ",")}% acima do limite`
                        : `${percent.toFixed(1).replace(".", ",")}% utilizado`}
                    </span>
                    <span
                      style={{
                        color: "var(--ryn-text-secondary)",
                        fontSize: "12px",
                        fontFamily: "'IBM Plex Mono', monospace"
                      }}
                    >
                      Limite: {formatCurrency(budget)}
                    </span>
                  </div>
                </>
              )}

              {/* Edit Section */}
              {isEditing ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--ryn-text-secondary)", fontSize: "13px" }}>R$</span>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={inputValue}
                    onChange={(e) => handleMoneyInputChange(e, setInputValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSetBudget(category);
                      if (e.key === "Escape") {
                        setEditingCategory(null);
                        setInputValue("");
                      }
                    }}
                    style={styles.editInput}
                  />
                  <button
                    onClick={() => handleSetBudget(category)}
                    style={styles.actionBtn("green")}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "rgba(139, 92, 246, 0.25)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "rgba(139, 92, 246, 0.15)")
                    }
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setInputValue("");
                    }}
                    style={styles.actionBtn("ghost")}
                  >
                    ✕
                  </button>
                </div>
              ) : budget > 0 ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setInputValue(formatMoneyInput(budget));
                    }}
                    style={{ ...styles.actionBtn("green"), flex: 1 }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "rgba(139, 92, 246, 0.25)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "rgba(139, 92, 246, 0.15)")
                    }
                  >
                    ✎ Editar Limite
                  </button>
                  <button
                    onClick={() => handleRemoveBudget(category)}
                    style={styles.actionBtn("red")}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "rgba(239, 68, 68, 0.20)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "rgba(239, 68, 68, 0.10)")
                    }
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setInputValue("");
                  }}
                  style={styles.noBudgetBtn}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
                    e.target.style.color = "#8B5CF6";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "var(--ryn-border-strong)";
                    e.target.style.color = "var(--ryn-text-muted)";
                  }}
                >
                  + Definir limite para {category}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
