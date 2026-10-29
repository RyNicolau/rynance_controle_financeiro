import React, { useState, useEffect, useCallback } from "react";

const TOAST_DURATION = 3500;

// Container global de toasts — renderiza os toasts no canto inferior
function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "80px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column-reverse",
      gap: "8px",
      pointerEvents: "none",
      maxWidth: "90vw",
      width: "380px"
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onDone]);

  const isError = toast.type === "error";
  const isWarning = toast.type === "warning";

  const bgColor = isError
    ? "rgba(239, 68, 68, 0.12)"
    : isWarning
    ? "rgba(251, 146, 60, 0.12)"
    : "rgba(34, 197, 94, 0.10)";

  const borderColor = isError
    ? "rgba(239, 68, 68, 0.25)"
    : isWarning
    ? "rgba(251, 146, 60, 0.25)"
    : "rgba(34, 197, 94, 0.25)";

  const textColor = isError ? "#ef4444" : isWarning ? "#fb923c" : "#22c55e";
  const icon = isError ? "✕" : isWarning ? "⚠" : "✓";

  return (
    <div style={{
      backgroundColor: bgColor,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${borderColor}`,
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "13px",
      fontWeight: 500,
      color: textColor,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      pointerEvents: "auto",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
    }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  );
}

// Hook para gerenciar toasts
let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastPortal = useCallback(() => (
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  ), [toasts, removeToast]);

  return { showToast, ToastPortal };
}

export default ToastContainer;
