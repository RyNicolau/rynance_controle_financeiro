import React, { useState } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { usePreferences } from "../contexts/PreferencesContext";
import { formatCurrency as formatCurrencyUtil } from "../utils/formatCurrency";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import { EXPENSE_CATEGORIES } from "../data/demoData";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const CATEGORY_COLORS = {
  // Despesas
  "Alimentação": "#f59e0b",
  "Transporte": "#10b981",
  "Moradia": "#3b82f6",
  "Saúde": "#ef4444",
  "Lazer": "#ec4899",
  "Educação": "#8b5cf6",
  "Vestuário": "#06b6d4",
  "Assinaturas": "#f43f5e",
  "Outros": "#64748b",
  // Receitas
  "Salário": "#10b981",
  "Freelance": "#3b82f6",
  "Investimentos": "#06b6d4",
  "Aluguel": "#f59e0b",
  "Bônus": "#8b5cf6",
  "Presente": "#ec4899"
};

const CATEGORY_ICONS = {
  // Despesas
  "Alimentação": "🍽️",
  "Transporte": "🚗",
  "Moradia": "🏠",
  "Saúde": "💊",
  "Lazer": "🎮",
  "Educação": "📚",
  "Vestuário": "👕",
  "Assinaturas": "📱",
  "Outros": "📦",
  // Receitas
  "Salário": "💼",
  "Freelance": "💻",
  "Investimentos": "📈",
  "Aluguel": "🔑",
  "Bônus": "🎁",
  "Presente": "💝"
};

// Helper functions for dates
const getMonthFromDate = (dateStr) => {
  const parts = dateStr.split("-");
  return Number(parts[1]) - 1;
};

const getYearFromDate = (dateStr) => {
  const parts = dateStr.split("-");
  return Number(parts[0]);
};

// Custom Tooltip component for Recharts ComposedChart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const receitas = payload.find(p => p.dataKey === "Receitas")?.value || 0;
    const despesas = payload.find(p => p.dataKey === "Despesas")?.value || 0;
    const saldo = payload.find(p => p.dataKey === "Saldo")?.value || 0;

    return (
      <div
        style={{
          backgroundColor: "var(--ryn-tooltip)",
          border: "1px solid var(--ryn-border)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "var(--ryn-text-secondary)",
            marginBottom: "8px",
            fontWeight: 500,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          {label}
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ryn-green)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
          ↑ Receitas: {receitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--ryn-red)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
          ↓ Despesas: {despesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        <div style={{ margin: "8px 0 4px", borderTop: "1px solid var(--ryn-border)" }} />
        <p style={{
          margin: 0,
          fontSize: "13px",
          color: saldo >= 0 ? "var(--ryn-green)" : "var(--ryn-red)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 700
        }}>
          {saldo >= 0 ? "● Superávit" : "● Déficit"}: {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for PieChart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.total || 1;
    const pct = ((data.value / total) * 100).toFixed(1).replace(".", ",");
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
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ryn-text)", fontWeight: 600 }}>
          {data.name}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "14px",
            color: CATEGORY_COLORS[data.name] || "var(--ryn-text)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700
          }}
        >
          {data.value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          })}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--ryn-text-secondary)" }}>
          {pct}% do total
        </p>
      </div>
    );
  }
  return null;
};

// Savings trend tooltip
const SavingsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0]?.value || 0;
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
        <p style={{ margin: 0, fontSize: "11px", color: "var(--ryn-text-secondary)", marginBottom: "4px" }}>
          {label}
        </p>
        <p style={{
          margin: 0,
          fontSize: "13px",
          color: val >= 0 ? "var(--ryn-green)" : "var(--ryn-red)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 700
        }}>
          {val >= 0 ? "Economizou" : "Déficit"}: {val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Reports({
  transactions,
  currentMonth,
  setCurrentMonth,
  currentYear
}) {
  const YEAR = currentYear || new Date().getFullYear();
  const isMobile = useIsMobile();
  const [hoveredPill, setHoveredPill] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [historyRange, setHistoryRange] = useState(6); // 6 or 12 months range

  // Filter transactions for the selected month (assume YEAR)
  const monthTransactions = transactions.filter((tx) => {
    return getMonthFromDate(tx.date) === currentMonth && getYearFromDate(tx.date) === YEAR;
  });

  const monthIncomes = monthTransactions.filter((t) => t.type === "income");
  const monthExpenses = monthTransactions.filter((t) => t.type === "expense");

  // Sum incomes and expenses for selected month
  const monthlyIncomeTotal = monthIncomes.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );
  const monthlyExpenseTotal = monthExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );

  // 1. Largest Income
  const largestIncome = monthIncomes.reduce(
    (max, curr) => (Number(curr.amount) > Number(max.amount) ? curr : max),
    { amount: 0, description: "Nenhum", category: "-" }
  );

  // 2. Largest Expense
  const largestExpense = monthExpenses.reduce(
    (max, curr) => (Number(curr.amount) > Number(max.amount) ? curr : max),
    { amount: 0, description: "Nenhum", category: "-" }
  );

  // 3. Savings calculations
  const savedAmount = monthlyIncomeTotal - monthlyExpenseTotal;
  const savingsRate =
    monthlyIncomeTotal > 0 ? (savedAmount / monthlyIncomeTotal) * 100 : 0;

  // Average daily expense
  const daysInMonth = new Date(YEAR, currentMonth + 1, 0).getDate();
  const avgDailyExpense = monthlyExpenseTotal / daysInMonth;

  // Count of transactions
  const totalTxCount = monthTransactions.length;
  const paidCount = monthTransactions.filter(t => t.status === "paid").length;
  const pendingCount = monthTransactions.filter(t => t.status === "pending").length;

  // Pie chart category aggregation
  const getPieData = () => {
    const totals = {};
    monthExpenses.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + Number(tx.amount);
    });

    return Object.keys(totals)
      .map((cat) => ({
        name: cat,
        value: totals[cat],
        total: monthlyExpenseTotal
      }))
      .sort((a, b) => b.value - a.value);
  };

  const pieData = getPieData();

  // Radar chart: spending per category normalized
  const getRadarData = () => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const spent = monthExpenses
        .filter(t => t.category === cat)
        .reduce((acc, c) => acc + Number(c.amount), 0);
      return {
        category: cat,
        gasto: spent
      };
    }).filter(d => d.gasto > 0);
  };

  const radarData = getRadarData();

  // Dynamic history data calculation based on historyRange selection
  const getHistoryData = () => {
    const result = [];
    for (let i = historyRange - 1; i >= 0; i--) {
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
        name: `${MONTHS[monthIdx]}/${year.toString().slice(-2)}`,
        Receitas: inc,
        Despesas: exp,
        Saldo: inc - exp
      });
    }
    return result;
  };

  const chartData = getHistoryData();

  // Savings trend (area chart data)
  const getSavingsTrend = () => {
    return chartData.map(d => ({
      name: d.name,
      Economia: d.Saldo
    }));
  };

  const savingsTrendData = getSavingsTrend();

  // Top 5 expenses breakdown
  const getTopExpenses = () => {
    return [...monthExpenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  };

  const topExpenses = getTopExpenses();

  // Compare current month vs previous month
  const getPrevMonthData = () => {
    let prevMonth = currentMonth - 1;
    let prevYear = YEAR;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }

    const prevTransactions = transactions.filter((tx) => {
      return getMonthFromDate(tx.date) === prevMonth && getYearFromDate(tx.date) === prevYear;
    });

    const prevIncome = prevTransactions
      .filter(t => t.type === "income")
      .reduce((acc, c) => acc + Number(c.amount), 0);

    const prevExpense = prevTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, c) => acc + Number(c.amount), 0);

    return { prevIncome, prevExpense, prevMonth, prevYear };
  };

  const { prevIncome, prevExpense, prevMonth: prevM } = getPrevMonthData();

  const incomeChange = prevIncome > 0 ? ((monthlyIncomeTotal - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpense > 0 ? ((monthlyExpenseTotal - prevExpense) / prevExpense) * 100 : 0;

  const { preferences } = usePreferences();

  const formatCurrency = (val) =>
    formatCurrencyUtil(val, {
      hideValues: preferences.hide_values,
      currency: preferences.currency,
      locale: preferences.locale
    });

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
    // KPI cards row
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(140px, 1fr))" : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px",
      marginBottom: "24px"
    },
    kpiCard: (isHovered, accentColor) => ({
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "14px",
      padding: isMobile ? "14px 16px" : "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      borderLeft: `3px solid ${accentColor}`,
      transform: isHovered ? "translateY(-3px)" : "none",
      boxShadow: isHovered
        ? "0 12px 28px -6px rgba(109, 40, 217, 0.2)"
        : "0 2px 12px rgba(0,0,0,0.12)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }),
    kpiLabel: {
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      color: "var(--ryn-text-secondary)"
    },
    kpiValue: {
      fontSize: isMobile ? "16px" : "18px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace"
    },
    kpiFooter: {
      fontSize: "11px",
      color: "var(--ryn-text-secondary)",
      marginTop: "2px"
    },
    // Chart grid
    chartsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "24px",
      marginBottom: "24px"
    },
    chartsRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
      gap: "24px"
    },
    chartsRowEqual: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "24px"
    },
    chartCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      padding: isMobile ? "16px" : "24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)"
    },
    chartHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    chartTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "var(--ryn-text)"
    },
    pieContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      flexWrap: "wrap",
      minHeight: "220px",
      flexDirection: isMobile ? "column" : "row"
    },
    legendContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      maxHeight: "260px",
      overflowY: "auto",
      paddingRight: "8px",
      flex: 1,
      minWidth: "150px"
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "12px",
      color: "var(--ryn-text)"
    },
    legendDot: (color) => ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: color,
      display: "inline-block",
      marginRight: "8px"
    }),
    // Stats cards
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px"
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
      fontSize: "13px",
      color: "var(--ryn-text-secondary)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    cardValue: {
      fontSize: "20px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--ryn-text)"
    },
    cardFooter: {
      fontSize: "12px",
      color: "var(--ryn-text-secondary)",
      marginTop: "4px"
    },
    topExpenseItem: (isHovered) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 12px",
      borderRadius: "10px",
      backgroundColor: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
      transition: "all 0.15s ease"
    }),
    rankBadge: (rank) => ({
      width: "22px",
      height: "22px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "11px",
      fontWeight: 700,
      backgroundColor: rank === 0 ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
      color: rank === 0 ? "#8B5CF6" : "var(--ryn-text-secondary)"
    })
  };

  return (
    <div style={styles.container} className="fade-in">
      <header style={styles.header}>
        <h1 style={styles.title}>Relatórios</h1>
        <p style={styles.subtitle}>
          Analise em detalhes o seu fluxo histórico e divisão de gastos
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

      {/* KPI Summary Row */}
      <div style={styles.kpiGrid}>
        <div
          onMouseEnter={() => setHoveredCard("kpi-income")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.kpiCard(hoveredCard === "kpi-income", "#22c55e")}
        >
          <span style={styles.kpiLabel}>Receita Total</span>
          <span style={{ ...styles.kpiValue, color: "#22c55e" }}>
            {formatCurrency(monthlyIncomeTotal)}
          </span>
          <span style={styles.kpiFooter}>
            {incomeChange !== 0 && (
              <span style={{ color: incomeChange > 0 ? "#22c55e" : "var(--ryn-red)", fontWeight: 600 }}>
                {incomeChange > 0 ? "▲" : "▼"} {Math.abs(incomeChange).toFixed(1).replace(".", ",")}%
              </span>
            )}
            {incomeChange !== 0 ? ` vs ${MONTHS[prevM]}` : `${monthIncomes.length} lançamentos`}
          </span>
        </div>

        <div
          onMouseEnter={() => setHoveredCard("kpi-expense")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.kpiCard(hoveredCard === "kpi-expense", "var(--ryn-red)")}
        >
          <span style={styles.kpiLabel}>Despesa Total</span>
          <span style={{ ...styles.kpiValue, color: "var(--ryn-red)" }}>
            {formatCurrency(monthlyExpenseTotal)}
          </span>
          <span style={styles.kpiFooter}>
            {expenseChange !== 0 && (
              <span style={{ color: expenseChange > 0 ? "var(--ryn-red)" : "#22c55e", fontWeight: 600 }}>
                {expenseChange > 0 ? "▲" : "▼"} {Math.abs(expenseChange).toFixed(1).replace(".", ",")}%
              </span>
            )}
            {expenseChange !== 0 ? ` vs ${MONTHS[prevM]}` : `${monthExpenses.length} lançamentos`}
          </span>
        </div>

        <div
          onMouseEnter={() => setHoveredCard("kpi-savings")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.kpiCard(hoveredCard === "kpi-savings", savedAmount >= 0 ? "#22c55e" : "var(--ryn-red)")}
        >
          <span style={styles.kpiLabel}>Economia</span>
          <span style={{ ...styles.kpiValue, color: savedAmount >= 0 ? "#22c55e" : "var(--ryn-red)" }}>
            {savingsRate.toFixed(1).replace(".", ",")}%
          </span>
          <span style={styles.kpiFooter}>
            {formatCurrency(savedAmount)}
          </span>
        </div>

        <div
          onMouseEnter={() => setHoveredCard("kpi-avg")}
          onMouseLeave={() => setHoveredCard(null)}
          style={styles.kpiCard(hoveredCard === "kpi-avg", "#8B5CF6")}
        >
          <span style={styles.kpiLabel}>Gasto Médio Diário</span>
          <span style={{ ...styles.kpiValue, color: "#8B5CF6" }}>
            {formatCurrency(avgDailyExpense)}
          </span>
          <span style={styles.kpiFooter}>
            {totalTxCount} transações · {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Row 1: Main ComposedChart + Pie Chart */}
      <div style={styles.chartsRow}>
        {/* Large Historical ComposedChart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Histórico de Fluxo de Caixa</span>
            <select
              value={historyRange}
              onChange={(e) => setHistoryRange(Number(e.target.value))}
              style={{
                backgroundColor: "var(--ryn-input)",
                border: "1px solid var(--ryn-border)",
                borderRadius: "6px",
                padding: "4px 8px",
                color: "var(--ryn-text-secondary)",
                fontSize: "11px",
                fontWeight: 500,
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
            </select>
          </div>
          <div style={{ width: "100%", height: isMobile ? 220 : 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  dy={10}
                  allowDuplicatedCategory={false}
                />
                <YAxis
                  stroke="var(--ryn-text-secondary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v === 0 ? "R$0" : `R$${v / 1000}k`)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <Bar
                  name="Receitas"
                  dataKey="Receitas"
                  fill="var(--ryn-green)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  name="Despesas"
                  dataKey="Despesas"
                  fill="var(--ryn-red)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Line
                  name="Saldo Líquido"
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart / Donut for Expenses */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Gastos por Categoria</span>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
              {MONTHS[currentMonth]} / {YEAR}
            </span>
          </div>

          <div style={styles.pieContainer}>
            {pieData.length === 0 ? (
              <div style={{ color: "var(--ryn-text-muted)", fontSize: "14px", padding: "40px 0" }}>
                Sem despesas registradas.
              </div>
            ) : (
              <>
                {/* Donut Chart */}
                <div style={{ width: 160, height: 160, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.name] || "#64748b"}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "10px", color: "var(--ryn-text-secondary)", fontWeight: 500 }}>
                      Total
                    </div>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--ryn-text)",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}>
                      {formatCurrency(monthlyExpenseTotal)}
                    </div>
                  </div>
                </div>

                {/* Legend list with percentages */}
                <div style={styles.legendContainer}>
                  {pieData.map((entry, idx) => {
                    const color = CATEGORY_COLORS[entry.name] || "var(--ryn-text-muted)";
                    const pct = monthlyExpenseTotal > 0
                      ? ((entry.value / monthlyExpenseTotal) * 100).toFixed(1).replace(".", ",")
                      : "0";
                    return (
                      <div key={idx} style={styles.legendItem}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={styles.legendDot(color)} />
                          <span style={{ fontWeight: 600, color: color }}>
                            {CATEGORY_ICONS[entry.name] || "📌"} {entry.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "10px",
                            color: "var(--ryn-text-secondary)",
                            fontWeight: 500,
                            backgroundColor: "rgba(255,255,255,0.04)",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            {pct}%
                          </span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "12px" }}>
                            {formatCurrency(entry.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Savings Trend (Area) + Radar Chart */}
      <div style={{ ...styles.chartsRowEqual, marginTop: "24px" }}>
        {/* Savings / Economy Area Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Tendência de Economia</span>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
              Receitas − Despesas
            </span>
          </div>
          <div style={{ width: "100%", height: isMobile ? 180 : 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={savingsTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(v) => (v === 0 ? "R$0" : `R$${v / 1000}k`)}
                />
                <Tooltip content={<SavingsTooltip />} cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="Economia"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="url(#savingsGradient)"
                  dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#A78BFA" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart — Category Distribution */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Radar de Gastos</span>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
              Distribuição por Categoria
            </span>
          </div>
          <div style={{ width: "100%", height: isMobile ? 180 : 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {radarData.length === 0 ? (
              <div style={{ color: "var(--ryn-text-muted)", fontSize: "14px" }}>
                Sem dados para exibir.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "var(--ryn-text-secondary)", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Gasto"
                    dataKey="gasto"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{
                            backgroundColor: "var(--ryn-tooltip)",
                            border: "1px solid var(--ryn-border)",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                          }}>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--ryn-text)", fontWeight: 600 }}>
                              {payload[0].payload.category}
                            </p>
                            <p style={{
                              margin: "3px 0 0",
                              fontSize: "13px",
                              color: "#8B5CF6",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontWeight: 700
                            }}>
                              {payload[0].value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top 5 Expenses + Statistical Cards */}
      <div style={{ ...styles.chartsRow, marginTop: "24px" }}>
        {/* Top 5 Expenses */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Top 5 Maiores Despesas</span>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
              {MONTHS[currentMonth]} / {YEAR}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {topExpenses.length === 0 ? (
              <div style={{ color: "var(--ryn-text-muted)", fontSize: "14px", padding: "20px 0", textAlign: "center" }}>
                Nenhuma despesa registrada.
              </div>
            ) : (
              topExpenses.map((tx, idx) => {
                const barWidth = monthlyExpenseTotal > 0
                  ? (Number(tx.amount) / Number(topExpenses[0].amount)) * 100
                  : 0;
                return (
                  <div
                    key={tx.id}
                    onMouseEnter={() => setHoveredCard(`top-${idx}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={styles.topExpenseItem(hoveredCard === `top-${idx}`)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                      <div style={styles.rankBadge(idx)}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px"
                        }}>
                          <div style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--ryn-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "200px"
                          }}>
                            {tx.description}
                          </div>
                          <span style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: "var(--ryn-red)",
                            whiteSpace: "nowrap",
                            marginLeft: "12px"
                          }}>
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div style={{
                          width: "100%",
                          height: "4px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          borderRadius: "2px",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, ${CATEGORY_COLORS[tx.category] || "var(--ryn-red)"}, ${CATEGORY_COLORS[tx.category] || "var(--ryn-red)"}88)`,
                            borderRadius: "2px",
                            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                          }} />
                        </div>
                        <div style={{
                          fontSize: "10px",
                          color: "var(--ryn-text-secondary)",
                          marginTop: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor: `${CATEGORY_COLORS[tx.category] || "#64748b"}20`,
                            color: CATEGORY_COLORS[tx.category] || "#64748b",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {CATEGORY_ICONS[tx.category] || "📌"} {tx.category}
                          </span>
                          <span>•</span>
                          <span>{tx.date.split("-").reverse().join("/")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Comparison + Savings Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Month vs Month Comparison */}
          <div
            onMouseEnter={() => setHoveredCard("compare")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "compare")}
          >
            <span style={styles.cardTitle}>Comparativo Mensal</span>
            <div style={{ display: "flex", gap: "20px", marginTop: "4px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", marginBottom: "4px" }}>
                  {MONTHS[prevM]}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "#22c55e" }}>
                  {formatCurrency(prevIncome)}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "var(--ryn-red)", marginTop: "2px" }}>
                  {formatCurrency(prevExpense)}
                </div>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                color: "var(--ryn-text-secondary)",
                fontSize: "18px"
              }}>
                →
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "var(--ryn-text-secondary)", marginBottom: "4px" }}>
                  {MONTHS[currentMonth]}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "#22c55e" }}>
                  {formatCurrency(monthlyIncomeTotal)}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "var(--ryn-red)", marginTop: "2px" }}>
                  {formatCurrency(monthlyExpenseTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Largest Income */}
          <div
            onMouseEnter={() => setHoveredCard("max-income")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "max-income")}
          >
            <span style={styles.cardTitle}>Maior Receita do Mês</span>
            <span style={{ ...styles.cardValue, color: "#22c55e", fontSize: "18px" }}>
              {largestIncome.amount > 0 ? formatCurrency(largestIncome.amount) : "R$ 0,00"}
            </span>
            <div style={styles.cardFooter}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                <span>{largestIncome.description}</span>
                {largestIncome.category && largestIncome.category !== "-" && (
                  <>
                    <span style={{ color: "var(--ryn-text-muted)" }}>·</span>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 600,
                      backgroundColor: `${CATEGORY_COLORS[largestIncome.category] || "#64748b"}20`,
                      color: CATEGORY_COLORS[largestIncome.category] || "#64748b",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {CATEGORY_ICONS[largestIncome.category] || "📌"} {largestIncome.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Largest Expense */}
          <div
            onMouseEnter={() => setHoveredCard("max-expense")}
            onMouseLeave={() => setHoveredCard(null)}
            style={styles.card(hoveredCard === "max-expense")}
          >
            <span style={styles.cardTitle}>Maior Despesa do Mês</span>
            <span style={{ ...styles.cardValue, color: "var(--ryn-red)", fontSize: "18px" }}>
              {largestExpense.amount > 0 ? formatCurrency(largestExpense.amount) : "R$ 0,00"}
            </span>
            <div style={styles.cardFooter}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                <span>{largestExpense.description}</span>
                {largestExpense.category && largestExpense.category !== "-" && (
                  <>
                    <span style={{ color: "var(--ryn-text-muted)" }}>·</span>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 600,
                      backgroundColor: `${CATEGORY_COLORS[largestExpense.category] || "#64748b"}20`,
                      color: CATEGORY_COLORS[largestExpense.category] || "#64748b",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {CATEGORY_ICONS[largestExpense.category] || "📌"} {largestExpense.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
