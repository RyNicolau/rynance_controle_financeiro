import React from "react";
import { formatMoneyInput, parseMoneyToNumber } from "../utils/currencyMask";

/**
 * Componente de Input com Máscara Monetária Automática (BRL).
 * Permite digitação natural de centavos e formatação instantânea (ex: 1.250,00).
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder = "0,00",
  style = {},
  required = false,
  autoFocus = false,
  onKeyDown,
  ...props
}) {
  const handleChange = (e) => {
    const formatted = formatMoneyInput(e.target.value);
    if (typeof onChange === "function") {
      onChange(formatted, parseMoneyToNumber(formatted));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value || ""}
      onChange={handleChange}
      required={required}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      style={{
        ...style,
        fontFamily: style.fontFamily || "'IBM Plex Mono', monospace"
      }}
      {...props}
    />
  );
}
