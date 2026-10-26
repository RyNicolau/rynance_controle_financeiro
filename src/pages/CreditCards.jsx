import React, { useState, useRef, useEffect } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { EXPENSE_CATEGORIES } from "../data/demoData";
import { supabase } from "../lib/supabase";
import { formatMoneyInput, parseMoneyToNumber, handleMoneyInputChange } from "../utils/currencyMask";

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const CARD_COLORS = [
  { id: "purple",  gradient: "linear-gradient(135deg, #6D28D9, #A78BFA)", label: "Roxo" },
  { id: "blue",    gradient: "linear-gradient(135deg, #1e40af, #60a5fa)", label: "Azul" },
  { id: "green",   gradient: "linear-gradient(135deg, #065f46, #34d399)", label: "Verde" },
  { id: "red",     gradient: "linear-gradient(135deg, #991b1b, #f87171)", label: "Vermelho" },
  { id: "orange",  gradient: "linear-gradient(135deg, #92400e, #fbbf24)", label: "Âmbar" },
  { id: "dark",    gradient: "linear-gradient(135deg, #111827, #374151)", label: "Preto" },
];

const AUTO_CATEGORIES = [
  { pattern: /super|mercado|mart|carrefour|extra|atacad|hortifruti|padaria|pao/i, cat: "Alimentação" },
  { pattern: /restaurante|lanche|pizza|burger|ifood|rappi|mc donalds|kfc|subway/i, cat: "Alimentação" },
  { pattern: /posto|combustivel|gasolina|petrobras|shell|ipiranga|br distribuidora/i, cat: "Transporte" },
  { pattern: /uber|99|taxi|metro|onibus|brt|bilhete/i, cat: "Transporte" },
  { pattern: /farmacia|drogaria|saude|medico|clinica|hospital|laboratorio/i, cat: "Saúde" },
  { pattern: /netflix|spotify|amazon|apple|google|disney|hbo|crunchyroll|play/i, cat: "Assinaturas" },
  { pattern: /cinema|show|teatro|ingresso|ticket/i, cat: "Lazer" },
  { pattern: /luz|energia|agua|gas canalizado|copasa|cemig|enel|sabesp/i, cat: "Moradia" },
  { pattern: /aluguel|condominio|iptu|imovel/i, cat: "Moradia" },
  { pattern: /tim|claro|vivo|oi|net|internet|telefone/i, cat: "Assinaturas" },
  { pattern: /livraria|curso|escola|faculdade|educacao/i, cat: "Educação" },
  { pattern: /roupa|moda|zara|riachuelo|renner|c&a|hering|lojas/i, cat: "Vestuário" },
];

const fixEncoding = (str) => {
  if (!str) return str;
  return str
    .replace(/Ã©/g, "é")
    .replace(/Ã£/g, "ã")
    .replace(/Ã§/g, "ç")
    .replace(/Ã¡/g, "á")
    .replace(/Ãª/g, "ê")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã/g, "À");
};

const autoCategory = (desc) => {
  for (const { pattern, cat } of AUTO_CATEGORIES) {
    if (pattern.test(desc)) return cat;
  }
  return "Outros";
};

const parseOFX = (text) => {
  const getVal = (tag, src) => {
    const m = src.match(new RegExp(`<${tag}>([^<\n\r]+)`, "i"));
    return m ? m[1].trim() : null;
  };
  const parseDate = (raw) => {
    if (!raw) return new Date().toISOString().slice(0, 10);
    const clean = raw.replace(/\[.*?\]/g, "").trim();
    if (clean.length < 8) return new Date().toISOString().slice(0, 10);
    return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`;
  };
  let blocks = [];
  const xmlMatches = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi);
  if (xmlMatches) {
    blocks = xmlMatches;
  } else {
    const parts = text.split(/<STMTTRN>/i);
    parts.shift();
    blocks = parts.map((p) => p.split(/<\/BANKTRANLIST>|<STMTTRN>/i)[0]);
  }
  return blocks.map((block) => {
    const trnamt = parseFloat(getVal("TRNAMT", block) || "0");
    const amount = Math.abs(trnamt);
    if (amount === 0) return null;
    const desc = getVal("MEMO", block) || getVal("NAME", block) || "Sem descrição";
    return {
      fitid: getVal("FITID", block) || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      date: parseDate(getVal("DTPOSTED", block)),
      amount,
      description: desc,
      trntype: getVal("TRNTYPE", block) || "DEBIT",
      type: trnamt > 0 ? "credit" : "debit",
      category: autoCategory(desc),
    };
  }).filter(Boolean);
};

function CardVisual({ card, spent, onClick, isSelected }) {
  const color = CARD_COLORS.find((c) => c.id === card.color) || CARD_COLORS[0];
  const pct = card.limit > 0 ? Math.min((spent / card.limit) * 100, 100) : 0;
  const barColor = pct > 90 ? "#ef4444" : pct > 70 ? "#fb923c" : "#22c55e";
  return (
    <div onClick={onClick} style={{ cursor: "pointer", borderRadius: "20px", padding: "24px", background: color.gradient, minWidth: "280px", maxWidth: "320px", width: "100%", position: "relative", isolation: "isolate", overflow: "hidden", boxShadow: isSelected ? "0 0 0 3px #fff, 0 0 0 5px #8B5CF6, 0 20px 40px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.3)", transition: "all 0.2s ease", transform: isSelected ? "translateY(-4px)" : "none", userSelect: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", top: 20, right: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", position: "relative" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.5px" }}>{card.name}</div>
        <svg width="36" height="24" viewBox="0 0 36 24" style={{ opacity: 0.8, position: "relative", zIndex: 2, pointerEvents: "none" }}>
          <circle cx="14" cy="12" r="10" fill="rgba(255,255,255,0.5)" />
          <circle cx="22" cy="12" r="10" fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>
      <div style={{ width: 36, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.4)", marginBottom: "20px", position: "relative" }}>
        <div style={{ position: "absolute", top: "33%", left: 0, right: 0, height: "34%", background: "rgba(255,255,255,0.15)" }} />
        <div style={{ position: "absolute", top: 0, left: "33%", bottom: 0, width: "34%", background: "rgba(255,255,255,0.1)" }} />
      </div>
      <div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gasto do mês</div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", fontFamily: "'IBM Plex Mono', monospace" }}>
          {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
        {card.limit > 0 && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "2px", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
              {pct.toFixed(0)}% de {card.limit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCardModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple");
  const [limit, setLimit] = useState("");
  const [nameErr, setNameErr] = useState("");
  const handleSubmit = () => {
    if (!name.trim()) { setNameErr("Informe o nome do cartão"); return; }
    onAdd({ name: name.trim(), color, limit: parseMoneyToNumber(limit) });
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "var(--ryn-card)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "20px", padding: "28px", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--ryn-text)" }}>Adicionar Cartão</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ryn-text-muted)", padding: "4px", display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Nome do Cartão</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setNameErr(""); }}
              placeholder="Ex: Nubank Roxo, Itaú Mastercard..."
              style={{ padding: "11px 14px", backgroundColor: "rgba(139,92,246,0.06)", border: `1.5px solid ${nameErr ? "rgba(239,68,68,0.6)" : "var(--ryn-border-strong)"}`, borderRadius: "10px", color: "var(--ryn-text)", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#8B5CF6"}
              onBlur={e => e.target.style.borderColor = nameErr ? "rgba(239,68,68,0.6)" : "var(--ryn-border-strong)"}
            />
            {nameErr && <span style={{ fontSize: "12px", color: "#ef4444" }}>{nameErr}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Cor do Cartão</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {CARD_COLORS.map((c) => (
                <button key={c.id} onClick={() => setColor(c.id)} title={c.label}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: c.gradient, border: color === c.id ? "3px solid #fff" : "3px solid transparent", outline: color === c.id ? "2px solid #8B5CF6" : "none", cursor: "pointer", transition: "all 0.15s ease" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ryn-text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Limite (opcional)</label>
            <input value={limit} onChange={(e) => handleMoneyInputChange(e, setLimit)} placeholder="0,00" inputMode="numeric"
              style={{ padding: "11px 14px", backgroundColor: "rgba(139,92,246,0.06)", border: "1.5px solid var(--ryn-border-strong)", borderRadius: "10px", color: "var(--ryn-text)", fontSize: "14px", fontFamily: "'IBM Plex Mono', monospace", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#8B5CF6"}
              onBlur={e => e.target.style.borderColor = "var(--ryn-border-strong)"}
            />
          </div>
          <button onClick={handleSubmit}
            style={{ marginTop: "4px", padding: "12px", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 12px rgba(109,40,217,0.35)" }}>
            Adicionar Cartão
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ preview, onConfirm, onClose }) {
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(preview.transactions.map((t) => [t.fitid, true]))
  );
  const [categories, setCategories] = useState(() =>
    Object.fromEntries(preview.transactions.map((t) => [t.fitid, t.category]))
  );
  const toggle = (fitid) => setSelections((s) => ({ ...s, [fitid]: !s[fitid] }));
  const toggleAll = () => {
    const allOn = Object.values(selections).every(Boolean);
    setSelections(Object.fromEntries(preview.transactions.map((t) => [t.fitid, !allOn])));
  };
  const selectedCount = Object.values(selections).filter(Boolean).length;
  const total = preview.transactions.filter((t) => selections[t.fitid] && t.type === "debit").reduce((a, c) => a + c.amount, 0);
  const handleConfirm = () => {
    const toImport = preview.transactions.filter((t) => selections[t.fitid]).map((t) => ({ ...t, category: categories[t.fitid] }));
    onConfirm(toImport);
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: "680px", maxHeight: "85vh", backgroundColor: "var(--ryn-card)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--ryn-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--ryn-text)" }}>Importar Extrato OFX</div>
            <div style={{ fontSize: "12px", color: "var(--ryn-text-muted)", marginTop: "2px" }}>
              {preview.transactions.length} transação(ões) encontrada(s) · {selectedCount} selecionada(s)
              {preview.dupCount > 0 && ` · ${preview.dupCount} duplicada(s) ignorada(s)`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ryn-text-muted)", padding: "4px", display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* Wrapper scroll */}
        <div style={{ overflowX: "auto", overflowY: "auto", WebkitOverflowScrolling: "touch", flex: 1 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "32px 90px 1fr 130px 100px", gap: "8px", padding: "10px 24px", fontSize: "11px", fontWeight: 600, color: "var(--ryn-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--ryn-border)", minWidth: "480px" }}>
            <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid #8B5CF6", backgroundColor: Object.values(selections).every(Boolean) ? "#8B5CF6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {Object.values(selections).every(Boolean) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            </button>
            <span>Data</span><span>Descrição</span><span>Categoria</span><span style={{ textAlign: "right" }}>Valor</span>
          </div>

          {/* Rows com minWidth também */}
          {preview.transactions.map((tx) => (
            <div key={tx.fitid} style={{ display: "grid", gridTemplateColumns: "32px 90px 1fr 130px 100px", gap: "8px", padding: "10px 24px", alignItems: "center", borderBottom: "1px solid var(--ryn-border)", opacity: selections[tx.fitid] ? 1 : 0.4, transition: "opacity 0.15s", minWidth: "480px" }}>
              <button onClick={() => toggle(tx.fitid)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selections[tx.fitid] ? "#8B5CF6" : "var(--ryn-border-strong)"}`, backgroundColor: selections[tx.fitid] ? "#8B5CF6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {selections[tx.fitid] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </button>
              <span style={{ fontSize: "12px", color: "var(--ryn-text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>{tx.date.split("-").reverse().join("/")}</span>
              <span style={{ fontSize: "13px", color: "var(--ryn-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.description}>{tx.description}</span>
              <select value={categories[tx.fitid]} onChange={(e) => setCategories((c) => ({ ...c, [tx.fitid]: e.target.value }))}
                style={{ fontSize: "11px", backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid var(--ryn-border-strong)", borderRadius: "6px", padding: "3px 6px", color: "var(--ryn-text)", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", cursor: "pointer" }}>
                {EXPENSE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <span style={{ fontSize: "13px", fontWeight: 600, color: tx.type === "credit" ? "#22c55e" : "#ef4444", fontFamily: "'IBM Plex Mono', monospace", textAlign: "right" }}>
                {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--ryn-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13px", color: "var(--ryn-text-secondary)" }}>
            Total débito: <strong style={{ color: "#ef4444", fontFamily: "'IBM Plex Mono', monospace" }}>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ padding: "10px 18px", background: "none", border: "1px solid var(--ryn-border-strong)", borderRadius: "10px", color: "var(--ryn-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cancelar</button>
            <button onClick={handleConfirm} disabled={selectedCount === 0}
              style={{ padding: "10px 22px", background: selectedCount === 0 ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8B5CF6, #6D28D9)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: selectedCount === 0 ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: selectedCount > 0 ? "0 4px 12px rgba(109,40,217,0.35)" : "none" }}>
              Importar {selectedCount > 0 ? `(${selectedCount})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreditCards({ user }) {
  const isMobile = useIsMobile();
  const [cards, setCards] = useState([]);
  const [ccTx, setCcTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [showAddCard, setShowAddCard] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importMsg, setImportMsg] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const fileRef = useRef();
  const activeImportCardId = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    const loadCreditCardData = async () => {
      const [{ data: cardsData }, { data: txData }] = await Promise.all([
        supabase.from("cc_cards").select("*").eq("user_id", user.id),
        supabase.from("cc_transactions").select("*").eq("user_id", user.id)
      ]);
      const mappedCards = (cardsData || []).map(c => ({
        id: c.id,
        user_id: c.user_id,
        name: c.name,
        color: c.color,
        limit: Number(c.card_limit)
      }));
      const mappedTx = (txData || []).map(t => ({
        id: t.id,
        cardId: t.card_id,
        user_id: t.user_id,
        fitid: t.fitid,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        category: t.category,
        type: t.type
      }));
      setCards(mappedCards);
      setCcTx(mappedTx);
      setLoading(false);
    };
    loadCreditCardData();
  }, [user?.id]);

  const handleAddCard = async (cardData) => {
    const newCardId = `card_${Date.now()}`;
    const newCard = {
      id: newCardId,
      user_id: user.id,
      name: cardData.name,
      color: cardData.color,
      card_limit: cardData.limit
    };
    setCards(prev => [...prev, { ...newCard, limit: cardData.limit }]);
    await supabase.from("cc_cards").insert(newCard);
    setSelectedCardId(newCardId);
  };

  const triggerImport = (cardId) => {
    activeImportCardId.current = cardId;
    fileRef.current.value = "";
    fileRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseOFX(ev.target.result);
        if (parsed.length === 0) {
          setImportMsg("Nenhuma transação encontrada no arquivo.");
          setTimeout(() => setImportMsg(""), 3000);
          return;
        }
        const existingFitids = new Set(ccTx.filter((t) => t.cardId === activeImportCardId.current).map((t) => t.fitid));
        const newOnly = parsed.filter((t) => !existingFitids.has(t.fitid));
        const dupCount = parsed.length - newOnly.length;
        if (newOnly.length === 0) {
          setImportMsg("Todas as transações já foram importadas anteriormente.");
          setTimeout(() => setImportMsg(""), 3000);
          return;
        }
        setImportPreview({ cardId: activeImportCardId.current, transactions: newOnly, dupCount });
      } catch {
        setImportMsg("Erro ao ler o arquivo OFX. Verifique o formato.");
        setTimeout(() => setImportMsg(""), 3000);
      }
    };
    reader.readAsText(file, "ISO-8859-1");
  };

  const confirmImport = async (toImport) => {
    const withId = toImport.map((t) => ({
      id: `cct_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      card_id: importPreview.cardId,
      user_id: user.id,
      fitid: t.fitid,
      date: t.date,
      amount: t.amount,
      description: t.description,
      category: t.category,
      type: t.type
    }));
    const mappedImport = withId.map(t => ({
      id: t.id,
      cardId: t.card_id,
      user_id: t.user_id,
      fitid: t.fitid,
      date: t.date,
      amount: t.amount,
      description: t.description,
      category: t.category,
      type: t.type
    }));
    setCcTx(prev => [...prev, ...mappedImport]);
    await supabase.from("cc_transactions").insert(withId);
    setImportPreview(null);

    // Auto-navigate to the most recent imported month
    if (mappedImport.length > 0) {
      const latestDate = mappedImport
        .map(t => new Date(t.date + "T00:00:00"))
        .sort((a, b) => b - a)[0];

      if (latestDate && !isNaN(latestDate)) {
        setViewMonth(latestDate.getMonth());
        setViewYear(latestDate.getFullYear());
      }

      // Select the imported card if not already selected
      if (selectedCardId !== importPreview.cardId) {
        setSelectedCardId(importPreview.cardId);
      }
    }

    setImportMsg(`${withId.length} transação(ões) importada(s) com sucesso!`);
    setTimeout(() => setImportMsg(""), 3000);
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Excluir este cartão e todas as suas transações?")) return;
    setCards(prev => prev.filter(c => c.id !== cardId));
    setCcTx(prev => prev.filter(t => t.cardId !== cardId));
    await supabase.from("cc_cards").delete().eq("id", cardId);
    if (selectedCardId === cardId) setSelectedCardId(null);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const getCardMonthlySpent = (cardId) =>
    ccTx.filter((t) => t.cardId === cardId && t.type === "debit" &&
      new Date(t.date + "T00:00:00").getMonth() === viewMonth &&
      new Date(t.date + "T00:00:00").getFullYear() === viewYear)
    .reduce((a, c) => a + c.amount, 0);

  const cardTx = ccTx.filter((t) => {
    if (t.cardId !== selectedCardId) return false;
    const d = new Date(t.date + "T00:00:00");
    if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) return false;
    if (filterCat !== "Todas" && t.category !== filterCat) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalDebit = cardTx.filter((t) => t.type === "debit").reduce((a, c) => a + c.amount, 0);
  const totalCredit = cardTx.filter((t) => t.type === "credit").reduce((a, c) => a + c.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat, total: cardTx.filter((t) => t.type === "debit" && t.category === cat).reduce((a, c) => a + c.amount, 0)
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };

  const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const s = {
    container: { padding: isMobile ? "20px 16px 80px" : "32px", minHeight: "100vh", backgroundColor: "var(--ryn-bg)", fontFamily: "'Plus Jakarta Sans', sans-serif" },
    title: { fontSize: isMobile ? "24px" : "30px", fontWeight: 800, background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #6D28D9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "4px", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "14px", color: "var(--ryn-text-secondary)" },
    glass: { backgroundColor: "var(--ryn-glass)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--ryn-glass-border)", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }
  };

  if (loading) {
    return (
      <div style={s.container}>
        <div style={{ ...s.glass, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "var(--ryn-text-secondary)" }}>Carregando dados dos cartões...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container} className="fade-in">
      <input ref={fileRef} type="file" accept=".ofx,.OFX" style={{ display: "none" }} onChange={handleFileChange} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={s.title}>Cartões de Crédito</h1>
          <p style={s.subtitle}>Visualize seus gastos por cartão • Importe extratos OFX</p>
        </div>
        <button onClick={() => setShowAddCard(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 12px rgba(109,40,217,0.35)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar Cartão
        </button>
      </div>

      {importMsg && (
        <div style={{ backgroundColor: importMsg.includes("Erro") || importMsg.includes("Nenhuma") || importMsg.includes("Todas") ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${importMsg.includes("Erro") || importMsg.includes("Nenhuma") || importMsg.includes("Todas") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: importMsg.includes("sucesso") ? "#22c55e" : "#ef4444", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <span>{importMsg.includes("sucesso") ? "✓" : "✕"}</span><span>{importMsg}</span>
        </div>
      )}

      {cards.length === 0 && (
        <div style={{ ...s.glass, padding: "64px 32px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💳</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "8px" }}>Nenhum cartão cadastrado</div>
          <div style={{ fontSize: "14px", color: "var(--ryn-text-muted)", marginBottom: "24px" }}>Adicione um cartão para começar a importar extratos OFX</div>
          <button onClick={() => setShowAddCard(true)} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Adicionar Primeiro Cartão</button>
        </div>
      )}

      {cards.length > 0 && (
        <div style={{ display: "flex", gap: "20px", overflowX: "auto", padding: "12px 12px 16px 12px", margin: "-12px -12px 18px -12px", position: "relative", zIndex: 1, WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}>
          {cards.map((card) => (
            <div key={card.id} style={{ position: "relative", scrollSnapAlign: "start", flexShrink: 0 }}>
              <CardVisual card={card} spent={getCardMonthlySpent(card.id)} onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)} isSelected={selectedCardId === card.id} />
              <div style={{ display: "flex", gap: "6px", marginTop: "10px", justifyContent: "center" }}>
                <button onClick={() => triggerImport(card.id)} style={{ flex: 1, padding: "7px 12px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", color: "#8B5CF6", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Importar OFX
                </button>
                <button onClick={() => handleDeleteCard(card.id)} style={{ padding: "7px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", width: isMobile ? "100%" : "auto" }}>
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--ryn-border-strong)", background: "none", cursor: "pointer", color: "var(--ryn-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--ryn-text)", minWidth: "160px", textAlign: "center" }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--ryn-border-strong)", background: "none", cursor: "pointer", color: "var(--ryn-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar transação..."
                style={{ padding: "7px 12px", backgroundColor: "rgba(139,92,246,0.06)", border: "1.5px solid var(--ryn-border-strong)", borderRadius: "8px", color: "var(--ryn-text)", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", width: isMobile ? "100%" : "180px" }}
                onFocus={e => e.target.style.borderColor = "#8B5CF6"}
                onBlur={e => e.target.style.borderColor = "var(--ryn-border-strong)"}
              />
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                style={{ padding: "7px 12px", backgroundColor: "rgba(139,92,246,0.06)", border: "1.5px solid var(--ryn-border-strong)", borderRadius: "8px", color: "var(--ryn-text)", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", cursor: "pointer", width: isMobile ? "100%" : "auto" }}>
                <option value="Todas">Todas as categorias</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Total Débito", value: fmt(totalDebit), color: "#ef4444" },
              { label: "Total Crédito", value: fmt(totalCredit), color: "#22c55e" },
              { label: "Lançamentos", value: cardTx.length, color: "#8B5CF6" },
              { label: "Saldo do Mês", value: fmt(totalCredit - totalDebit), color: totalCredit - totalDebit >= 0 ? "#22c55e" : "#ef4444" }
            ].map((stat) => (
              <div key={stat.label} style={{ ...s.glass, padding: "14px 16px" }}>
                <div style={{ fontSize: "10px", color: "var(--ryn-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{stat.label}</div>
                <div style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: 700, color: stat.color, fontFamily: "'IBM Plex Mono', monospace" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: "20px", alignItems: "start" }}>
            <div style={{ ...s.glass, overflow: "hidden" }}>
              {cardTx.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "6px" }}>Nenhuma transação neste mês</div>
                  <div style={{ fontSize: "13px", color: "var(--ryn-text-muted)" }}>Importe um arquivo OFX para visualizar</div>
                </div>
              ) : isMobile ? (
                /* Visualização em lista otimizada para Mobile */
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px" }}>
                  {cardTx.map((tx) => {
                    const isCredit = tx.type === "credit";
                    const formattedDate = tx.date.split("-").reverse().join("/");
                    const cleanDesc = fixEncoding(tx.description);
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 14px",
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--ryn-border)",
                          borderRadius: "12px",
                          gap: "12px"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "var(--ryn-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                            title={cleanDesc}
                          >
                            {cleanDesc}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "11px", color: "var(--ryn-text-secondary)" }}>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formattedDate}</span>
                            <span>•</span>
                            <span style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "#8B5CF6", borderRadius: "6px", padding: "2px 6px", fontWeight: 500 }}>
                              {tx.category}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: isCredit ? "#22c55e" : "#ef4444", flexShrink: 0, textAlign: "right" }}>
                          {isCredit ? "+" : "-"}{fmt(tx.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Visualização em tabela para Desktop */
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px minmax(120px, 1fr) 110px 100px", gap: "12px", padding: "12px 20px", fontSize: "11px", fontWeight: 600, color: "var(--ryn-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--ryn-border)", minWidth: "420px" }}>
                    <span>Data</span><span>Descrição</span><span>Categoria</span><span style={{ textAlign: "right" }}>Valor</span>
                  </div>
                  {cardTx.map((tx) => (
                    <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "90px minmax(120px, 1fr) 110px 100px", gap: "12px", padding: "12px 20px", alignItems: "center", borderBottom: "1px solid var(--ryn-border)", transition: "background 0.15s", minWidth: "420px" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <span style={{ fontSize: "12px", color: "var(--ryn-text-secondary)", fontFamily: "'IBM Plex Mono', monospace" }}>{tx.date.split("-").reverse().join("/")}</span>
                      <span style={{ fontSize: "13px", color: "var(--ryn-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fixEncoding(tx.description)}>{fixEncoding(tx.description)}</span>
                      <span style={{ fontSize: "11px", backgroundColor: "rgba(139,92,246,0.08)", color: "#8B5CF6", borderRadius: "6px", padding: "2px 8px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "110px", display: "block" }}>{tx.category}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: tx.type === "credit" ? "#22c55e" : "#ef4444", fontFamily: "'IBM Plex Mono', monospace", textAlign: "right" }}>
                        {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ ...s.glass, padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ryn-text)", marginBottom: "16px" }}>Gastos por Categoria</div>
              {byCategory.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--ryn-text-muted)", textAlign: "center", padding: "24px 0" }}>Sem dados neste período</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {byCategory.map(({ cat, total: catTotal }) => {
                    const pct = totalDebit > 0 ? (catTotal / totalDebit) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--ryn-text)" }}>{cat}</span>
                          <span style={{ fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", color: "#ef4444", fontWeight: 600 }}>{fmt(catTotal)}</span>
                        </div>
                        <div style={{ height: "5px", borderRadius: "3px", backgroundColor: "var(--ryn-border)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", borderRadius: "3px", transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--ryn-text-muted)", marginTop: "2px" }}>{pct.toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showAddCard && <AddCardModal onAdd={handleAddCard} onClose={() => setShowAddCard(false)} />}
      {importPreview && (
        <ImportModal preview={importPreview} onConfirm={confirmImport} onClose={() => setImportPreview(null)} />
      )}
    </div>
  );
}
