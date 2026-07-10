import React, { useState, useEffect } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../data/demoData";

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

export default function Transactions({
  transactions,
  setTransactions,
  toggleStatus,
  currentMonth,
  setCurrentMonth,
  currentYear
}) {
  const isMobile = useIsMobile();
  // Form visibility and fields
  const [formOpen, setFormOpen] = useState(false);
  const [txType, setTxType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [txStatus, setTxStatus] = useState("paid");

  // Edit modal state
  const [editingTx, setEditingTx] = useState(null);
  const [editType, setEditType] = useState("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTxStatus, setEditTxStatus] = useState("paid");

  // Hover and confirmation states
  const [hoveredPill, setHoveredPill] = useState(null);
  const [hoveredTx, setHoveredTx] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // Set default category when type changes (add form)
  useEffect(() => {
    if (txType === "income") {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [txType]);

  // Update edit category when editType changes
  useEffect(() => {
    if (editingTx) {
      if (editType === "income") {
        setEditCategory(INCOME_CATEGORIES[0]);
      } else {
        setEditCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  }, [editType]);

  // Open edit modal populated with transaction data
  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditType(tx.type);
    setEditAmount(String(tx.amount));
    setEditDate(tx.date);
    setEditCategory(tx.category);
    setEditDescription(tx.description);
    setEditTxStatus(tx.status);
    setConfirmDeleteId(null);
  };

  const handleCloseEdit = () => {
    setEditingTx(null);
  };

  // Save edited transaction
  const handleEditSave = (e) => {
    e.preventDefault();
    if (
      !editAmount ||
      isNaN(editAmount) ||
      Number(editAmount) <= 0 ||
      !editDescription ||
      !editDate ||
      !editCategory
    ) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }
    const updated = transactions.map((t) => {
      if (t.id === editingTx.id) {
        return {
          ...t,
          type: editType,
          amount: Number(editAmount),
          date: editDate,
          category: editCategory,
          description: editDescription,
          status: editTxStatus
        };
      }
      return t;
    });
    setTransactions(updated);
    setEditingTx(null);
  };

  // Handle add transaction save
  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !amount ||
      isNaN(amount) ||
      Number(amount) <= 0 ||
      !description ||
      !date ||
      !category
    ) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }
    const newTx = {
      id: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      type: txType,
      amount: Number(amount),
      category,
      description,
      date,
      status: txStatus
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    setAmount("");
    setDescription("");
    setTxStatus("paid");
    setFormOpen(false);
  };

  // Handle delete
  const handleDelete = (id) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    setConfirmDeleteId(null);
  };

  const handleExportPDF = () => {
    const fmt = (val) => Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const fmtDate = (d) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

    const income  = monthTransactions.filter(t => t.type === "income").reduce((a,c) => a + Number(c.amount), 0);
    const expense = monthTransactions.filter(t => t.type === "expense").reduce((a,c) => a + Number(c.amount), 0);
    const balance = income - expense;
    const pending = monthTransactions.filter(t => t.status === "pending").length;
    const balanceColor = balance >= 0 ? "#16a34a" : "#dc2626";
    const balanceBg    = balance >= 0 ? "#f0fdf4" : "#fef2f2";

    const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    const rows = monthTransactions.map(tx => {
      const isIncome = tx.type === "income";
      const isPaid   = tx.status === "paid";
      return `<tr>
        <td>${fmtDate(tx.date)}</td>
        <td>${tx.description}</td>
        <td>${tx.category}</td>
        <td style="color:${isIncome?"#16a34a":"#dc2626"};font-weight:600;font-family:monospace;">
          ${isIncome?"+":"-"} ${fmt(tx.amount)}
        </td>
        <td><span style="
          background:${isPaid?(isIncome?"#dcfce7":"#fee2e2"):"#fef3c7"};
          color:${isPaid?(isIncome?"#16a34a":"#dc2626"):"#d97706"};
          padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;
        ">${isPaid?(isIncome?"Recebido":"Pago"):"Pendente"}</span></td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
    <title>Rynance — Relatório ${MONTH_NAMES[currentMonth]} ${currentYear}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e1e2e;padding:40px;font-size:13px}
      .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #ede9fe}
      .brand{display:flex;align-items:center;gap:10px}
      .brand-name{font-size:26px;font-weight:800;background:linear-gradient(135deg,#8B5CF6,#6D28D9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .report-meta{text-align:right}.report-meta h2{font-size:16px;font-weight:700;color:#4c1d95}
      .report-meta p{font-size:11px;color:#7c3aed;margin-top:2px}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
      .card{background:#f5f3ff;border-radius:10px;padding:14px 18px;border-left:4px solid #8B5CF6}
      .card.income{border-left-color:#16a34a;background:#f0fdf4}
      .card.expense{border-left-color:#dc2626;background:#fef2f2}
      .card-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:4px}
      .card-value{font-size:17px;font-weight:700;font-family:monospace}
      .card.income .card-value{color:#16a34a}.card.expense .card-value{color:#dc2626}
      table{width:100%;border-collapse:collapse}
      thead tr{background:#4c1d95;color:white}
      thead th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
      tbody tr{border-bottom:1px solid #f3f0ff}
      tbody td{padding:10px 14px;color:#374151}
      .footer{margin-top:32px;padding-top:16px;border-top:1px solid #ede9fe;display:flex;justify-content:space-between;color:#9ca3af;font-size:11px}
      .footer strong{color:#7c3aed}
      @media print{body{padding:20px}@page{margin:1.5cm;size:A4}}
    </style></head><body>
    <div class="header">
      <div class="brand">
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
          <defs><linearGradient id="g" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#6D28D9"/>
          </linearGradient></defs>
          <path d="M18 18 L18 82" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/>
          <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="url(#g)" stroke-width="12" stroke-linecap="round" fill="none"/>
          <path d="M36 58 L72 82" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/>
          <line x1="20" y1="92" x2="20" y2="82" stroke="url(#g)" stroke-width="7" stroke-linecap="round"/>
          <line x1="34" y1="92" x2="34" y2="76" stroke="url(#g)" stroke-width="7" stroke-linecap="round"/>
          <line x1="48" y1="92" x2="48" y2="68" stroke="url(#g)" stroke-width="7" stroke-linecap="round"/>
        </svg>
        <span class="brand-name">Rynance</span>
      </div>
      <div class="report-meta">
        <h2>Relatório de Contas a Pagar</h2>
        <p>${MONTH_NAMES[currentMonth]} de ${currentYear} · ${monthTransactions.length} lançamento${monthTransactions.length!==1?"s":""} · ${pending} pendente${pending!==1?"s":""}</p>
      </div>
    </div>
    <div class="summary">
      <div class="card income"><div class="card-label">Receitas</div><div class="card-value">${fmt(income)}</div></div>
      <div class="card expense"><div class="card-label">Despesas</div><div class="card-value">${fmt(expense)}</div></div>
      <div class="card" style="border-left-color:${balanceColor};background:${balanceBg}">
        <div class="card-label">Saldo do Mês</div><div class="card-value" style="color:${balanceColor}">${fmt(balance)}</div>
      </div>
      <div class="card"><div class="card-label">Pendentes</div><div class="card-value" style="color:#d97706">${pending} item${pending!==1?"s":""}</div></div>
    </div>
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>Gerado em ${new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</span>
      <span>Relatório gerado por <strong>Rynance</strong></span>
    </div>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  // Filter transactions for current month and year
  const monthTransactions = transactions
    .filter(
      (tx) =>
        getMonthFromDate(tx.date) === currentMonth &&
        getYearFromDate(tx.date) === currentYear
    )
    .sort(
      (a, b) =>
        new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00")
    );

  // Calculate monthly summary
  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const pendingIncome = monthTransactions
    .filter((t) => t.type === "income" && t.status === "pending")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const pendingExpense = monthTransactions
    .filter((t) => t.type === "expense" && t.status === "pending")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

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
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "stretch" : "flex-start",
      flexDirection: isMobile ? "column" : "row",
      marginBottom: "24px",
      gap: "16px",
      flexWrap: "wrap"
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
    headerActions: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap"
    },
    addBtn: (isHovered) => ({
      padding: "10px 18px",
      backgroundColor: isHovered ? "#7C3AED" : "#8B5CF6",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease"
    }),
    exportBtn: (isHovered) => ({
      padding: "10px 16px",
      backgroundColor: isHovered
        ? "rgba(139, 92, 246, 0.12)"
        : "rgba(255,255,255,0.04)",
      color: isHovered ? "#8B5CF6" : "var(--ryn-text-secondary)",
      border: "1px solid var(--ryn-border)",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      transition: "all 0.2s ease"
    }),
    formCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      padding: "24px",
      marginBottom: "28px",
      display: formOpen ? "block" : "none",
      animation: "fadeIn 0.2s ease forwards"
    },
    toggleWrapper: {
      display: "flex",
      backgroundColor: "var(--ryn-input)",
      borderRadius: "8px",
      padding: "4px",
      width: "fit-content",
      marginBottom: "20px",
      border: "1px solid var(--ryn-border)"
    },
    toggleBtn: (isActive, type) => ({
      padding: "8px 20px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
      backgroundColor: isActive
        ? type === "income"
          ? "rgba(34, 197, 94, 0.15)"
          : "var(--ryn-red-bg)"
        : "transparent",
      color: isActive
        ? type === "income"
          ? "#22c55e"
          : "var(--ryn-red)"
        : "var(--ryn-text-secondary)",
      transition: "all 0.2s ease"
    }),
    formGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px",
      marginBottom: "20px"
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    label: {
      fontSize: "11px",
      color: "var(--ryn-text-muted)",
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    input: {
      backgroundColor: "var(--ryn-input)",
      border: "1px solid var(--ryn-border)",
      borderRadius: "8px",
      padding: "10px 14px",
      color: "var(--ryn-text)",
      fontSize: "14px",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    saveBtn: (isHovered) => ({
      padding: "12px 24px",
      backgroundColor: isHovered ? "#7C3AED" : "#8B5CF6",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      width: "fit-content",
      transition: "all 0.2s ease"
    }),
    pillsContainer: {
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      paddingBottom: "12px",
      marginBottom: "28px"
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
    summaryCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      padding: "18px 24px",
      marginBottom: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    },
    listContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    txItem: (isHovered) => ({
      display: "flex",
      alignItems: isMobile ? "stretch" : "center",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: isMobile ? "flex-start" : "space-between",
      gap: isMobile ? "12px" : 0,
      padding: isMobile ? "14px 16px" : "14px 20px",
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: "16px",
      boxShadow: isHovered
        ? "0 16px 32px -8px rgba(109, 40, 217, 0.25)"
        : "0 2px 12px rgba(0,0,0,0.12)",
      transform: isHovered && !isMobile ? "translateX(3px)" : "none",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }),
    categoryBadge: (category) => {
      const color = CATEGORY_COLORS[category] || "#64748b";
      return {
        padding: "3px 8px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: 500,
        backgroundColor: `${color}18`,
        color: color,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px"
      };
    },
    statusBadge: (status) => ({
      padding: "3px 8px",
      borderRadius: "10px",
      fontSize: "11px",
      fontWeight: 600,
      backgroundColor: status === "paid" ? "rgba(34, 197, 94, 0.12)" : "rgba(251, 146, 60, 0.10)",
      color: status === "paid" ? "#22c55e" : "#fb923c"
    }),
    txValue: (isIncome, isPending) => ({
      fontSize: "15px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
      color: isPending ? "#fb923c" : isIncome ? "#22c55e" : "var(--ryn-red)",
      opacity: isPending ? 0.85 : 1
    }),
    iconBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "5px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "6px",
      transition: "all 0.2s ease",
      color: "#64748b"
    },
    confirmWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      color: "var(--ryn-red)",
      fontWeight: 600
    },
    confirmBtn: (isYes) => ({
      border: "none",
      background: isYes
        ? "var(--ryn-red-bg)"
        : "rgba(255, 255, 255, 0.05)",
      color: isYes ? "var(--ryn-red)" : "var(--ryn-text)",
      padding: "4px 8px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
      fontWeight: 600,
      transition: "all 0.2s ease"
    }),
    // Modal overlay
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    },
    modalCard: {
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid var(--ryn-glass-border)",
      borderRadius: isMobile ? "20px" : "16px",
      padding: isMobile ? "24px 20px" : "32px",
      width: "100%",
      maxWidth: isMobile ? "100%" : "560px",
      maxHeight: isMobile ? "90vh" : "auto",
      overflowY: "auto",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
      animation: "fadeIn 0.2s ease forwards"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px"
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: 700,
      color: "var(--ryn-text)"
    },
    closeBtn: {
      background: "none",
      border: "none",
      color: "var(--ryn-text-muted)",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      borderRadius: "6px",
      transition: "all 0.2s ease"
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Contas a Pagar</h1>
          <p style={styles.subtitle}>
            Gerencie e registre suas movimentações — {MONTHS[currentMonth]}/{currentYear}
          </p>
        </div>
        <div style={styles.headerActions}>
          {monthTransactions.length > 0 && (
            <button
              onClick={handleExportPDF}
              onMouseEnter={() => setHoveredBtn("export")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={styles.exportBtn(hoveredBtn === "export")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Exportar PDF
            </button>
          )}
          <button
            onClick={() => setFormOpen(!formOpen)}
            onMouseEnter={() => setHoveredBtn("add")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={styles.addBtn(hoveredBtn === "add")}
          >
            {formOpen ? (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Fechar
              </>
            ) : (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Novo Lançamento
              </>
            )}
          </button>
        </div>
      </header>

      {/* Expandable Add Form */}
      <div style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div style={styles.toggleWrapper}>
            <button
              type="button"
              onClick={() => setTxType("expense")}
              style={styles.toggleBtn(txType === "expense", "expense")}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setTxType("income")}
              style={styles.toggleBtn(txType === "income", "income")}
            >
              Receita
            </button>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...styles.input, appearance: "none" }}
              >
                {(txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Descrição</label>
              <input
                type="text"
                placeholder="Ex: Aluguel, Salário, Uber..."
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={txStatus}
                onChange={(e) => setTxStatus(e.target.value)}
                style={{ ...styles.input, appearance: "none" }}
              >
                <option value="paid">
                  {txType === "income" ? "Recebido" : "Pago"}
                </option>
                <option value="pending">Pendente / Em aberto</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            onMouseEnter={() => setHoveredBtn("save")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={styles.saveBtn(hoveredBtn === "save")}
          >
            Salvar Lançamento
          </button>
        </form>
      </div>

      {/* Month Selector Pills */}
      <div style={styles.pillsContainer}>
        {MONTHS.map((month, idx) => {
          const isActive = currentMonth === idx;
          const isHovered = hoveredPill === idx;
          return (
            <button
              key={idx}
              onClick={() => {
                setCurrentMonth(idx);
                setConfirmDeleteId(null);
              }}
              onMouseEnter={() => setHoveredPill(idx)}
              onMouseLeave={() => setHoveredPill(null)}
              style={styles.pill(isActive, isHovered)}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div style={styles.summaryCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ fontSize: "14px", color: "var(--ryn-text-secondary)" }}>
            {monthTransactions.length === 0
              ? "Nenhum lançamento em "
              : `${monthTransactions.length} lançamento${monthTransactions.length > 1 ? "s" : ""} em `}
            <strong style={{ color: "var(--ryn-text)" }}>{MONTHS[currentMonth]}</strong>
          </div>
          <div style={{ display: "flex", gap: "24px", fontSize: "14px", flexWrap: "wrap" }}>
            <div>
              Receitas:{" "}
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "#22c55e",
                  fontWeight: 700
                }}
              >
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div>
              Despesas:{" "}
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "var(--ryn-red)",
                  fontWeight: 700
                }}
              >
                {formatCurrency(totalExpense)}
              </span>
            </div>
            <div>
              Saldo:{" "}
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: totalIncome - totalExpense >= 0 ? "#22c55e" : "var(--ryn-red)",
                  fontWeight: 700
                }}
              >
                {formatCurrency(totalIncome - totalExpense)}
              </span>
            </div>
          </div>
        </div>

        {(pendingIncome > 0 || pendingExpense > 0) && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "20px",
              fontSize: "12px",
              color: "#fb923c",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "10px",
              flexWrap: "wrap"
            }}
          >
            {pendingIncome > 0 && (
              <span>
                A receber: <strong>{formatCurrency(pendingIncome)}</strong>
              </span>
            )}
            {pendingExpense > 0 && (
              <span>
                Em aberto: <strong>{formatCurrency(pendingExpense)}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div style={styles.listContainer}>
        {monthTransactions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "56px 24px",
              color: "var(--ryn-text-secondary)",
              backgroundColor: "var(--ryn-glass)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--ryn-glass-border)",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              fontSize: "14px",
              lineHeight: 1.8
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
            <div style={{ fontWeight: 600, color: "var(--ryn-text)", marginBottom: "4px" }}>
              Nenhum lançamento em {MONTHS[currentMonth]}
            </div>
            <div>Use o botão "Novo Lançamento" para adicionar.</div>
          </div>
        ) : (
          monthTransactions.map((tx) => {
            const isIncome = tx.type === "income";
            const isHovered = hoveredTx === tx.id;
            const isPending = tx.status === "pending";

            const [y, m, d] = tx.date.split("-");
            const formattedDate = `${d}/${m}/${y}`;

            return (
              <div
                key={tx.id}
                onMouseEnter={() => setHoveredTx(tx.id)}
                onMouseLeave={() => setHoveredTx(null)}
                style={styles.txItem(isHovered)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {/* Status Toggle */}
                  <button
                    onClick={() => toggleStatus(tx.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: !isPending ? "#22c55e" : "var(--ryn-text-muted)",
                      transition: "color 0.2s ease",
                      outline: "none",
                      flexShrink: 0
                    }}
                    title={!isPending ? "Marcar como Pendente" : "Marcar como Pago"}
                  >
                    {!isPending ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </button>

                  {/* Info */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--ryn-text)",
                        opacity: isPending ? 0.85 : 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {tx.description}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "var(--ryn-text-secondary)",
                        flexWrap: "wrap"
                      }}
                    >
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span style={styles.categoryBadge(tx.category)}>
                        {CATEGORY_ICONS[tx.category] || "📌"} {tx.category}
                      </span>
                      <span>•</span>
                      <span style={styles.statusBadge(tx.status, isIncome)}>
                        {tx.status === "paid"
                          ? isIncome
                            ? "Recebido"
                            : "Pago"
                          : isIncome
                          ? "A receber"
                          : "Pendente"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexShrink: 0
                  }}
                >
                  <div style={styles.txValue(isIncome, isPending)}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(tx)}
                    style={styles.iconBtn}
                    title="Editar lançamento"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(139, 92, 246, 0.10)";
                      e.currentTarget.style.color = "#8B5CF6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--ryn-text-secondary)";
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  {/* Delete / Confirm */}
                  {confirmDeleteId === tx.id ? (
                    <div style={styles.confirmWrapper}>
                      <span>Excluir?</span>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        style={styles.confirmBtn(true)}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor =
                            "rgba(248,113,113,0.28)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor =
                            "rgba(248,113,113,0.15)")
                        }
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={styles.confirmBtn(false)}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor =
                            "rgba(255,255,255,0.10)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor =
                            "rgba(255,255,255,0.05)")
                        }
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(tx.id)}
                      style={styles.iconBtn}
                      title="Excluir lançamento"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--ryn-red-bg)";
                        e.currentTarget.style.color = "var(--ryn-red)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--ryn-text-secondary)";
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== EDIT MODAL ===== */}
      {editingTx && (
        <div
          style={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEdit();
          }}
        >
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Editar Lançamento</span>
              <button
                onClick={handleCloseEdit}
                style={styles.closeBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "var(--ryn-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--ryn-text-muted)";
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSave}>
              {/* Type Toggle */}
              <div style={{ ...styles.toggleWrapper, marginBottom: "20px" }}>
                <button
                  type="button"
                  onClick={() => setEditType("expense")}
                  style={styles.toggleBtn(editType === "expense", "expense")}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setEditType("income")}
                  style={styles.toggleBtn(editType === "income", "income")}
                >
                  Receita
                </button>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Data</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ ...styles.input, appearance: "none" }}
                  >
                    {(editType === "income"
                      ? INCOME_CATEGORIES
                      : EXPENSE_CATEGORIES
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Descrição</label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    value={editTxStatus}
                    onChange={(e) => setEditTxStatus(e.target.value)}
                    style={{ ...styles.input, appearance: "none" }}
                  >
                    <option value="paid">
                      {editType === "income" ? "Recebido" : "Pago"}
                    </option>
                    <option value="pending">Pendente / Em aberto</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  onMouseEnter={() => setHoveredBtn("editSave")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={styles.saveBtn(hoveredBtn === "editSave")}
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "var(--ryn-text-secondary)",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "rgba(255,255,255,0.09)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "rgba(255,255,255,0.05)")
                  }
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
