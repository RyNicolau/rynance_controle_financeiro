import React, { useState } from "react";

const PRESET_GRADIENTS = {
  "preset:purple": "linear-gradient(135deg, #a78bfa, #6d28d9)",
  "preset:blue": "linear-gradient(135deg, #60a5fa, #2563eb)",
  "preset:emerald": "linear-gradient(135deg, #34d399, #059669)",
  "preset:sunset": "linear-gradient(135deg, #fca5a5, #b91c1c)",
  "preset:coral": "linear-gradient(135deg, #f472b6, #db2777)"
};

export default function Sidebar({
  currentTab,
  setCurrentTab,
  transactions,
  budgets,
  currentMonth,
  currentYear,
  darkMode,
  setDarkMode,
  user,
  onLogout,
  isMobile = false,
  isOpen = false,
  onClose
}) {
  const [hoveredTab, setHoveredTab] = useState(null);

  // Calcule o saldo total geral (todos os lançamentos pagos)
  const totalBalance = transactions.reduce((acc, curr) => {
    if (curr.status !== "paid") return acc;
    if (curr.type === "income") {
      return acc + Number(curr.amount);
    } else {
      return acc - Number(curr.amount);
    }
  }, 0);

  const formattedBalance = totalBalance.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  // Count ALL pending transactions
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  // Count categories over budget this month
  const overBudgetCount = (() => {
    const monthExpenses = transactions.filter((tx) => {
      const parts = tx.date.split("-");
      const m = Number(parts[1]) - 1;
      const y = Number(parts[0]);
      return tx.type === "expense" && m === currentMonth && y === currentYear;
    });
    return Object.keys(budgets).filter((cat) => {
      const spent = monthExpenses
        .filter((t) => t.category === cat)
        .reduce((a, c) => a + Number(c.amount), 0);
      return spent > budgets[cat];
    }).length;
  })();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      shortLabel: "Home",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    },
    {
      id: "transactions",
      label: "Contas a Pagar",
      shortLabel: "Contas",
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: "#fb923c",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    },
    {
      id: "budget",
      label: "Orçamento",
      shortLabel: "Orçamento",
      badge: overBudgetCount > 0 ? overBudgetCount : null,
      badgeColor: "var(--ryn-red)",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: "reports",
      label: "Relatórios",
      shortLabel: "Relatórios",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: "cards",
      label: "Cartões",
      shortLabel: "Cartões",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    },
    {
      id: "subscriptions",
      label: "Assinaturas",
      shortLabel: "Assinaturas",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
      )
    },
    {
      id: "settings",
      label: "Configurações",
      shortLabel: "Config",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  const styles = {
    sidebar: {
      width: "220px",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      backgroundColor: "var(--ryn-glass)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderRight: "1px solid var(--ryn-border)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      zIndex: isMobile ? 400 : 100,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transform: isMobile ? (isOpen ? "translateX(0)" : "translateX(-100%)") : "none",
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      overflowY: "auto"
    },
    logoContainer: {
      marginBottom: "2px",
      fontSize: "24px",
      fontWeight: 700,
      color: "var(--ryn-text)",
      letterSpacing: "-0.5px"
    },
    logoFlow: { color: "#8B5CF6" },
    subtitle: {
      fontSize: "10px",
      color: "var(--ryn-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "36px",
      fontWeight: 500
    },
    menu: {
      listStyle: "none",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    menuItem: (isActive, isHovered) => ({
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      border: "none",
      backgroundColor: isActive
        ? "rgba(139, 92, 246, 0.10)"
        : isHovered
        ? "rgba(255, 255, 255, 0.03)"
        : "transparent",
      color: isActive ? "#8B5CF6" : isHovered ? "#ffffff" : "var(--ryn-text-secondary)",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 500,
      textAlign: "left",
      outline: "none",
      transform: isHovered && !isActive ? "translateX(3px)" : "none",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative"
    }),
    activeIndicator: {
      position: "absolute",
      left: "-16px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "3px",
      height: "20px",
      backgroundColor: "#8B5CF6",
      borderRadius: "0 3px 3px 0",
      boxShadow: "0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.4)"
    },
    badge: (color) => ({
      marginLeft: "auto",
      minWidth: "18px",
      height: "18px",
      borderRadius: "9px",
      backgroundColor: color || "#fb923c",
      color: "#ffffff",
      fontSize: "10px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 5px"
    }),
    divider: {
      height: "1px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      margin: "8px 0"
    },
    footer: {
      paddingTop: "16px",
      borderTop: "1px solid var(--ryn-border)",
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    balanceLabel: {
      fontSize: "10px",
      color: "var(--ryn-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontWeight: 500
    },
    balanceValue: (isPositive) => ({
      fontSize: "16px",
      fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
      color: isPositive ? "#22c55e" : "var(--ryn-red)",
      transition: "color 0.2s ease"
    }),
    balanceNote: {
      fontSize: "10px",
      color: "var(--ryn-text-muted)",
      marginTop: "2px"
    }
  };

  return (
    <>
      <aside style={styles.sidebar}>
      <div>
        <div style={{ marginBottom: "2px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="rGrad" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#A78BFA"/>
                  <stop offset="100%" stopColor="#6D28D9"/>
                </linearGradient>
              </defs>
              <path d="M18 18 L18 82" stroke="url(#rGrad)" strokeWidth="12" strokeLinecap="round"/>
              <path d="M18 18 Q58 18 58 38 Q58 58 18 58" stroke="url(#rGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M36 58 L72 82" stroke="url(#rGrad)" strokeWidth="12" strokeLinecap="round"/>
              <line x1="20" y1="92" x2="20" y2="82" stroke="url(#rGrad)" strokeWidth="7" strokeLinecap="round"/>
              <line x1="34" y1="92" x2="34" y2="76" stroke="url(#rGrad)" strokeWidth="7" strokeLinecap="round"/>
              <line x1="48" y1="92" x2="48" y2="68" stroke="url(#rGrad)" strokeWidth="7" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontSize: "22px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px"
            }}>Rynance</span>
          </div>
          {isMobile && (
            <button onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ryn-text-muted)", padding: "4px", display: "flex" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <div style={styles.subtitle}>controle financeiro pessoal</div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={styles.menu}>
          {menuItems.map((item, index) => {
            const isActive = currentTab === item.id;
            const isHovered = hoveredTab === item.id;

            // Divider before settings
            const showDivider = index === menuItems.length - 1;

            return (
              <React.Fragment key={item.id}>
                {showDivider && <li style={styles.divider} />}
                <li>
                  <button
                    onClick={() => setCurrentTab(item.id)}
                    onMouseEnter={() => setHoveredTab(item.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    style={styles.menuItem(isActive, isHovered)}
                  >
                    {isActive && <span style={styles.activeIndicator} />}
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.badge != null && (
                      <span style={styles.badge(item.badgeColor)}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </nav>

      <div style={styles.footer}>
        <div style={styles.balanceLabel}>Saldo Efetivo</div>
        <div style={styles.balanceValue(totalBalance >= 0)}>{formattedBalance}</div>
        <div style={styles.balanceNote}>Apenas lançamentos pagos</div>

        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "1px solid var(--ryn-border-strong)",
            borderRadius: "20px",
            padding: "6px 12px",
            cursor: "pointer",
            color: "var(--ryn-text-secondary)",
            fontSize: "11px",
            fontWeight: 500,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            width: "100%",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#8B5CF6"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--ryn-border-strong)"}
        >
          {darkMode ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Modo Claro
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Modo Escuro
            </>
          )}
        </button>

        {/* User info + Logout */}
        {user && (
          <div style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 0 0",
            borderTop: "1px solid var(--ryn-border)"
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: "50%",
              background: user.photo && PRESET_GRADIENTS[user.photo]
                ? PRESET_GRADIENTS[user.photo]
                : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              backgroundImage: user.photo && !user.photo.startsWith("preset:")
                ? `url(${user.photo})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              border: "1px solid var(--ryn-border-strong)"
            }}>
              {!user.photo && (user.name ? user.name.charAt(0).toUpperCase() : "U")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ryn-text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>{user.name || "Usuário"}</div>
              <div style={{
                fontSize: 10,
                color: "var(--ryn-text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              title="Sair da conta"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ryn-text-muted)",
                padding: 4,
                display: "flex",
                borderRadius: 6,
                transition: "color 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--ryn-red)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--ryn-text-muted)"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>

      {/* Bottom Tab Bar no mobile */}
      {isMobile && (
        <nav className="ryn-bottom-nav">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={isActive ? "active" : ""}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  {item.icon}
                </span>
                <span>{item.shortLabel}</span>
                {item.badge != null && (
                  <span
                    className="nav-badge"
                    style={{ backgroundColor: item.badgeColor || "#fb923c" }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
