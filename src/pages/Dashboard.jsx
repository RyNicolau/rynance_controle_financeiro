import React, { useState, useEffect, useRef } from "react";
import useIsMobile from "../hooks/useIsMobile";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const getMonthFromDate = (dateStr) => {
  const parts = dateStr.split("-");
  return Number(parts[1]) - 1; // 0-indexed month
};

const getYearFromDate = (dateStr) => {
  const parts = dateStr.split("-");
  return Number(parts[0]);
};

const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    if (start === end) return;
    const startTime = performance.now();
    cancelAnimationFrame(rafRef.current);
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(end);
        prevRef.current = end;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
};

// Simple tooltip for the mini bar chart
const MiniTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const receitas = payload.find(p => p.dataKey === "Receitas")?.value || 0;
    const despesas = payload.find(p => p.dataKey === "Despesas")?.value || 0;
    return (
      <div
        style={{
          backgroundColor: "var(--ryn-tooltip)",
          border: "1px solid var(--ryn-border)",
          padding: "10px 14px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        }}
      >
        <p style={{ margin: 0, fontSize: "11px", color: "var(--ryn-text-secondary)", marginBottom: "6px", fontWeight: 500 }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--ryn-green)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
          + {receitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--ryn-red)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
          - {despesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({
  transactions,
  toggleStatus,
  currentMonth,
  setCurrentMonth,
  setCurrentTab,
  currentYear
}) {
  const YEAR = currentYear || new Date().getFullYear();
  const isMobile = useIsMobile();
  const [hoveredPill, setHoveredPill] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredTx, setHoveredTx] = useState(null);

  // Filter transactions for the selected month (assume current YEAR)
  const monthTransactions = transactions.filter((tx) => {
    return getMonthFromDate(tx.date) === currentMonth && getYearFromDate(tx.date) === YEAR;
  });

  // Calculate monthly metrics
  const monthlyIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const monthlyExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;
  
  const incomeCount = monthTransactions.filter((t) => t.type === "income").length;

  const expensePercentage =
    monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;

  const animatedIncome  = useCountUp(monthlyIncome);
  const animatedExpense = useCountUp(monthlyExpense);
  const animatedBalance = useCountUp(monthlyBalance);

  // Simple 6-month history for the mini chart (no selector)
  const getHistoryData = () => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      let monthIdx = currentMonth - i;
      let year = YEAR;
      while (monthIdx < 0) {
        monthIdx += 12;
        year -= 1;
      }

      const mTransactions = transactions.filter((tx) => {
        return getMonthFromDate(tx.date) === monthIdx && getYearFromDate(tx.date) === year;
      });

      const inc = mTransactions
        .filter((t) => t.type === "income")
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const exp = mTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      result.push({
        name: MONTHS[monthIdx],
        Receitas: inc,
        Despesas: exp
      });
    }
    return result;
  };

  const chartData = getHistoryData();

  // Get last 6 transactions overall sorted by date (descending)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00"))
    .slice(0, 6);

  // Format currency
  const formatCurrency = (val) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const styles = {
    container: {
      padding: isMobile ? "20px 16px" : "32px",
      minHeight: "100vh",
      backgroundColor: "var(--ryn-bg)",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    header: {
      marginBottom: "24px"
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
    pillsContainer: {
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      paddingBottom: "12px",
      marginBottom: "28px",
      scrollbarWidth: "thin"
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
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
      gap: isMobile ? "12px" : "20px",
      marginBottom: isMobile ? "20px" : "28px"
    },
    card: (isHovered) => ({
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      transform: isHovered ? "translateY(-4px)" : "none",
      boxShadow: isHovered
        ? "0 16px 32px -8px rgba(109, 40, 217, 0.25)"
        : "0 2px 12px rgba(0,0,0,0.12)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }),
    cardTitle: {
      fontSize: "14px",
      color: "var(--ryn-text-secondary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    cardValue: {
      fontSize: "24px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--ryn-text)"
    },
    cardFooter: (color) => ({
      fontSize: "12px",
      color: color || "var(--ryn-text-secondary)",
      fontWeight: 500,
      marginTop: "4px"
    }),
    contentGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
      gap: isMobile ? "16px" : "20px"
    },
    chartCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)"
    },
    chartTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "var(--ryn-text)"
    },
    listCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      maxHeight: "440px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)"
    },
    txItem: (isHovered) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 12px",
      borderRadius: "8px",
      backgroundColor: isHovered ? "rgba(255, 255, 255, 0.02)" : "transparent",
      transition: "background-color 0.2s ease",
      cursor: "pointer"
    }),
    iconWrapper: (isIncome) => ({
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isIncome ? "rgba(34, 197, 94, 0.10)" : "var(--ryn-red-bg)",
      color: isIncome ? "#22c55e" : "var(--ryn-red)"
    }),
    txValue: (isIncome) => ({
      fontSize: "14px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
      color: isIncome ? "#22c55e" : "var(--ryn-red)"
    }),
    viewAllBtn: {
      width: "100%",
      textAlign: "center",
      backgroundColor: "transparent",
      border: "none",
      color: "#8B5CF6",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      padding: "8px 0",
      marginTop: "auto",
      outline: "none",
      transition: "color 0.2s ease"
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Visão geral do seu desempenho financeiro</p>
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

      {/* Summary Metrics Cards */}
      <div style={styles.metricsGrid}>
        {/* Income Card */}
        <div
          onMouseEnter={() => setHoveredCard("income")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.card(hoveredCard === "income")}
        >
          <span style={styles.cardTitle}>Receitas do Mês</span>
          <span style={{ ...styles.cardValue, color: "#22c55e" }}>
            {formatCurrency(animatedIncome)}
          </span>
          <span style={styles.cardFooter("var(--ryn-text-secondary)")}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{incomeCount}</span>{" "}
            {incomeCount === 1 ? "lançamento" : "lançamentos"}
          </span>
        </div>

        {/* Expenses Card */}
        <div
          onMouseEnter={() => setHoveredCard("expense")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.card(hoveredCard === "expense")}
        >
          <span style={styles.cardTitle}>Despesas do Mês</span>
          <span style={{ ...styles.cardValue, color: "var(--ryn-red)" }}>
            {formatCurrency(animatedExpense)}
          </span>
          <span style={styles.cardFooter("var(--ryn-text-secondary)")}>
            <span style={{ color: "var(--ryn-red)", fontWeight: 700 }}>
              {expensePercentage.toFixed(1).replace(".", ",")}%
            </span>{" "}
            da renda total gasta
          </span>
        </div>

        {/* Balance Card */}
        <div
          onMouseEnter={() => setHoveredCard("balance")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.card(hoveredCard === "balance")}
        >
          <span style={styles.cardTitle}>
            {monthlyBalance >= 0 ? "Superávit do Mês" : "Déficit do Mês"}
          </span>
          <span
            style={{
              ...styles.cardValue,
              color: monthlyBalance >= 0 ? "#22c55e" : "var(--ryn-red)"
            }}
          >
            {formatCurrency(animatedBalance)}
          </span>
          <span
            style={styles.cardFooter(monthlyBalance >= 0 ? "#22c55e" : "var(--ryn-red)")}
          >
            Resultado financeiro líquido
          </span>
        </div>
      </div>

      {/* Main Charts & History Area */}
      <div style={styles.contentGrid}>
        {/* Simplified Bar Chart — no legend, no line, no selector */}
        <div style={styles.chartCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={styles.chartTitle}>Resumo dos Últimos 6 Meses</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--ryn-green)", display: "inline-block" }} />
                <span style={{ fontSize: "11px", color: "var(--ryn-text-secondary)" }}>Receitas</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--ryn-red)", display: "inline-block" }} />
                <span style={{ fontSize: "11px", color: "var(--ryn-text-secondary)" }}>Despesas</span>
              </div>
            </div>
          </div>
          <div style={{ width: "100%", height: isMobile ? 200 : 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--ryn-text-secondary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="var(--ryn-text-secondary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v === 0 ? "0" : `${v / 1000}k`)}
                />
                <Tooltip content={<MiniTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar
                  dataKey="Receitas"
                  fill="var(--ryn-green)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="Despesas"
                  fill="var(--ryn-red)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div style={styles.listCard}>
          <span style={styles.chartTitle}>Últimos Lançamentos</span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              overflowY: "auto",
              paddingRight: "4px"
            }}
          >
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isHovered = hoveredTx === tx.id;
              
              // format date string (YYYY-MM-DD -> DD/MM/YYYY)
              const [y, m, d] = tx.date.split("-");
              const formattedDate = `${d}/${m}/${y}`;

              return (
                <div
                  key={tx.id}
                  onMouseEnter={() => setHoveredTx(tx.id)}
                  onMouseLeave={() => setHoveredTx(null)}
                  onClick={() => setCurrentTab("transactions")}
                  style={styles.txItem(isHovered)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={styles.iconWrapper(isIncome)}>
                      {isIncome ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="19 12 12 19 5 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--ryn-text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "140px"
                        }}
                      >
                        {tx.description}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", marginTop: "2px" }}>
                        {tx.category} • {formattedDate}
                      </div>
                    </div>
                  </div>
                  <div style={styles.txValue(isIncome)}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentTab("transactions")}
            style={styles.viewAllBtn}
            onMouseEnter={(e) => (e.target.style.color = "#A78BFA")}
            onMouseLeave={(e) => (e.target.style.color = "#8B5CF6")}
          >
            Ver todos Lançamentos →
          </button>
        </div>
      </div>

      {/* Botão flutuante + para novo lançamento */}
      <button
        onClick={() => {
          // Sinaliza para a aba de transações abrir o formulário automaticamente
          sessionStorage.setItem("ryn_open_form", "1");
          setCurrentTab("transactions");
        }}
        title="Novo lançamento"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(109, 40, 217, 0.5), 0 0 0 0 rgba(139,92,246,0.4)",
          transition: "all 0.2s ease",
          zIndex: 50,
          animation: "fabPulse 2.5s ease-in-out infinite"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(109, 40, 217, 0.65)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(109, 40, 217, 0.5)";
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Tooltip do botão */}
      <div style={{
        position: "fixed",
        bottom: "90px",
        right: "22px",
        backgroundColor: "var(--ryn-card)",
        border: "1px solid var(--ryn-glass-border)",
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--ryn-text-secondary)",
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 0.2s ease",
        whiteSpace: "nowrap",
        zIndex: 49
      }} id="fab-tooltip">
        Novo lançamento
      </div>
    </div>
  );
}
