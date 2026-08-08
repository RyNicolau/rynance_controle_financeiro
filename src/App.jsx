import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import CreditCards from "./pages/CreditCards";
import { demoTransactions } from "./data/demoData";
import { useWindowSize } from "./hooks/useWindowSize";
import { supabase } from "./lib/supabase";

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  const { isMobile } = useWindowSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSetTab = (tab) => {
    setCurrentTab(tab);
    setSidebarOpen(false);
  };

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("name").eq("id", session.user.id).maybeSingle()
          .then(({ data: profile }) => {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profile?.name || session.user.user_metadata?.name || "Usuário",
              photo: session.user.user_metadata?.photo || ""
            });
          });
      }
      setAuthReady(true);
    });

    // Ouvir mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleUpdateUser = async (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);

    // Update profiles name if name is changing
    if (updatedData.name !== undefined) {
      await supabase.from("profiles").update({
        name: updatedData.name
      }).eq("id", user.id);
    }

    // Also update Auth user_metadata so that metadata is persistent across page reloads
    const metaUpdate = {};
    if (updatedData.name !== undefined) metaUpdate.name = updatedData.name;
    if (updatedData.photo !== undefined) metaUpdate.photo = updatedData.photo;

    if (Object.keys(metaUpdate).length > 0) {
      await supabase.auth.updateUser({
        data: metaUpdate
      });
    }
  };

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      const [{ data: txData }, { data: budgetData }] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("budgets").select("*").eq("user_id", user.id)
      ]);

      setTransactions(txData || []);
      const budgetMap = {};
      (budgetData || []).forEach(b => { budgetMap[b.category] = b.amount; });
      setBudgets(budgetMap);
      setDataLoaded(true);
    };

    loadData();
  }, [user?.id]);

  // State to manage active page view
  const [currentTab, setCurrentTab] = useState("dashboard");

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("ryn_theme");
    return saved !== null ? saved === "dark" : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("ryn_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("ryn_theme", "light");
    }
  }, [darkMode]);

  const toggleStatus = async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const newStatus = tx.status === "paid" ? "pending" : "paid";
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from("transactions").update({ status: newStatus }).eq("id", id);
  };

  const saveTransactions = async (newTx) => {
    const oldIds = new Set(transactions.map(t => t.id));
    const newIds = new Set(newTx.map(t => t.id));
    const deletedIds = [...oldIds].filter(id => !newIds.has(id));
    
    setTransactions(newTx);
    
    if (deletedIds.length > 0) {
      await supabase.from("transactions").delete().in("id", deletedIds);
    }
    
    if (newTx.length > 0) {
      const withUserId = newTx.map(t => ({
        id: t.id,
        user_id: user.id,
        type: t.type,
        amount: Number(t.amount),
        category: t.category,
        description: t.description,
        date: t.date,
        status: t.status
      }));
      await supabase.from("transactions").upsert(withUserId, { onConflict: "id" });
    }
  };

  const saveBudgets = async (newBudgets) => {
    setBudgets(newBudgets);
    const rows = Object.entries(newBudgets).map(([category, amount]) => ({
      user_id: user.id, category, amount
    }));
    await supabase.from("budgets").delete().eq("user_id", user.id);
    if (rows.length > 0) await supabase.from("budgets").insert(rows);
  };

  // Shared props for all pages
  const commonProps = {
    transactions,
    currentMonth,
    setCurrentMonth,
    currentYear: CURRENT_YEAR
  };

  // Render active page component
  const renderActivePage = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboard
            {...commonProps}
            toggleStatus={toggleStatus}
            setCurrentTab={setCurrentTab}
          />
        );
      case "transactions":
        return (
          <Transactions
            {...commonProps}
            setTransactions={saveTransactions}
            toggleStatus={toggleStatus}
          />
        );
      case "reports":
        return <Reports {...commonProps} />;
      case "budget":
        return (
          <Budget
            {...commonProps}
            budgets={budgets}
            setBudgets={saveBudgets}
          />
        );
      case "settings":
        return (
          <Settings
            transactions={transactions}
            setTransactions={saveTransactions}
            budgets={budgets}
            setBudgets={saveBudgets}
            user={user}
            updateUser={handleUpdateUser}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        );
      case "cards":
        return <CreditCards user={user} />;
      default:
        return (
          <Dashboard
            {...commonProps}
            toggleStatus={toggleStatus}
            setCurrentTab={setCurrentTab}
          />
        );
    }
  };

  const styles = {
    layoutContainer: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "var(--ryn-bg)"
    },
    mainContent: {
      marginLeft: isMobile ? 0 : "220px",
      paddingTop: isMobile ? "60px" : 0,
      paddingBottom: isMobile ? "70px" : 0,
      flex: 1,
      minWidth: 0,
      backgroundColor: "var(--ryn-bg)"
    }
  };

  const PRESET_GRADIENTS = {
    "preset:purple":  "linear-gradient(135deg, #a78bfa, #6d28d9)",
    "preset:blue":    "linear-gradient(135deg, #60a5fa, #2563eb)",
    "preset:emerald": "linear-gradient(135deg, #34d399, #059669)",
    "preset:sunset":  "linear-gradient(135deg, #fca5a5, #b91c1c)",
    "preset:coral":   "linear-gradient(135deg, #f472b6, #db2777)"
  };

  const avatarStyle = {
    width: 34, height: 34, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
    background: user?.photo && PRESET_GRADIENTS[user.photo]
      ? PRESET_GRADIENTS[user.photo]
      : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    backgroundImage: user?.photo && !user.photo.startsWith("preset:")
      ? `url(${user.photo})` : undefined,
    backgroundSize: "cover", backgroundPosition: "center",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#fff",
    border: "2px solid rgba(139,92,246,0.4)",
    transition: "border-color 0.2s"
  };

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--ryn-bg)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <defs><linearGradient id="lG" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#6D28D9"/>
            </linearGradient></defs>
            <path d="M18 18 L18 82" stroke="url(#lG)" strokeWidth="12" strokeLinecap="round"/>
            <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="url(#lG)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M36 58 L72 82" stroke="url(#lG)" strokeWidth="12" strokeLinecap="round"/>
            <line x1="20" y1="92" x2="20" y2="82" stroke="url(#lG)" strokeWidth="7" strokeLinecap="round"/>
            <line x1="34" y1="92" x2="34" y2="76" stroke="url(#lG)" strokeWidth="7" strokeLinecap="round"/>
            <line x1="48" y1="92" x2="48" y2="68" stroke="url(#lG)" strokeWidth="7" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: "13px", color: "var(--ryn-text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div style={styles.layoutContainer}>

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "60px", zIndex: 200,
          backgroundColor: "var(--ryn-glass)", backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid var(--ryn-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--ryn-text)", display: "flex" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
              <defs><linearGradient id="mG" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#6D28D9"/>
              </linearGradient></defs>
              <path d="M18 18 L18 82" stroke="url(#mG)" strokeWidth="12" strokeLinecap="round"/>
              <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="url(#mG)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M36 58 L72 82" stroke="url(#mG)" strokeWidth="12" strokeLinecap="round"/>
              <line x1="20" y1="92" x2="20" y2="82" stroke="url(#mG)" strokeWidth="7" strokeLinecap="round"/>
              <line x1="34" y1="92" x2="34" y2="76" stroke="url(#mG)" strokeWidth="7" strokeLinecap="round"/>
              <line x1="48" y1="92" x2="48" y2="68" stroke="url(#mG)" strokeWidth="7" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: "18px", fontWeight: 800,
              background: "linear-gradient(135deg, #A78BFA, #6D28D9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Rynance
            </span>
          </div>

          {/* Avatar — abre Configurações */}
          <div onClick={() => { handleSetTab("settings"); }}
            style={avatarStyle}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#8B5CF6"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"}
          >
            {(!user?.photo || user.photo.startsWith("preset:")) && (
              <span>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
            )}
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300,
            backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
      )}

      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleSetTab}
        transactions={transactions}
        budgets={budgets}
        currentMonth={currentMonth}
        currentYear={CURRENT_YEAR}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onLogout={handleLogout}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main style={styles.mainContent}>{renderActivePage()}</main>
    </div>
  );
}
