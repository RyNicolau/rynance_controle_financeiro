/**
 * Formatação centralizada de moeda para todo o Rynance.
 * Todas as páginas devem usar estas funções em vez de duplicar formatCurrency localmente.
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * @param {number} val - Valor a formatar
 * @param {object} opts - Opções opcionais
 * @param {boolean} opts.hideValues - Se true, substitui o valor por "•••••"
 * @param {string} opts.currency - Código da moeda (padrão: "BRL")
 * @param {string} opts.locale - Locale (padrão: "pt-BR")
 * @returns {string}
 */
export const formatCurrency = (val, opts = {}) => {
  const { hideValues = false, currency = "BRL", locale = "pt-BR" } = opts;

  if (hideValues) {
    const symbols = { BRL: "R$", USD: "$", EUR: "€" };
    return `${symbols[currency] || currency} •••••`;
  }

  if (typeof val !== "number" || isNaN(val)) val = 0;

  return val.toLocaleString(locale, {
    style: "currency",
    currency: currency
  });
};

/**
 * Formata valor sem o símbolo de moeda (útil para gráficos/tooltips).
 */
export const formatNumber = (val, opts = {}) => {
  const { hideValues = false, locale = "pt-BR" } = opts;

  if (hideValues) return "•••••";
  if (typeof val !== "number" || isNaN(val)) val = 0;

  return val.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
