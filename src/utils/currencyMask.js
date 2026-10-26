/**
 * Utilitários para máscara monetária brasileira (BRL)
 */

/**
 * Formata um valor numérico ou dígitos digitados no padrão brasileiro "1.234,56".
 * Utiliza o padrão de preenchimento por centavos (shift de dígitos), padrão em apps bancários:
 * "1" -> "0,01"
 * "15" -> "0,15"
 * "150" -> "1,50"
 * "1500" -> "15,00"
 * "15000" -> "150,00"
 * "150000" -> "1.500,00"
 */
export const formatMoneyInput = (value) => {
  if (value === null || value === undefined || value === "") return "";

  // Se já for número
  if (typeof value === "number") {
    if (isNaN(value)) return "";
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Se for string, extrai apenas dígitos
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  const numberValue = parseInt(digits, 10) / 100;
  return numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Converte string formatada brasileira ("1.234,56") para número float JS (1234.56).
 */
export const parseMoneyToNumber = (value) => {
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }
  if (!value) return 0;

  const digits = String(value).replace(/\D/g, "");
  if (!digits) return 0;

  return parseInt(digits, 10) / 100;
};

/**
 * Helper para evento onChange de input de valor
 */
export const handleMoneyInputChange = (e, setter) => {
  const formatted = formatMoneyInput(e.target.value);
  setter(formatted);
};
