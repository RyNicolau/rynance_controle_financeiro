import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const PreferencesContext = createContext(null);

const DEFAULT_PREFERENCES = {
  theme: "dark",
  accent_color: "purple",
  currency: "BRL",
  locale: "pt-BR",
  hide_values: false,
  month_start_day: 1
};

// Cores de destaque disponíveis
export const ACCENT_COLORS = {
  purple: { label: "Roxo", primary: "#8B5CF6", gradient: "linear-gradient(135deg, #A78BFA, #6D28D9)" },
  blue:   { label: "Azul", primary: "#3B82F6", gradient: "linear-gradient(135deg, #60A5FA, #2563EB)" },
  emerald:{ label: "Esmeralda", primary: "#10B981", gradient: "linear-gradient(135deg, #34D399, #059669)" },
  sunset: { label: "Pôr do Sol", primary: "#F97316", gradient: "linear-gradient(135deg, #FB923C, #EA580C)" },
  coral:  { label: "Coral", primary: "#EC4899", gradient: "linear-gradient(135deg, #F472B6, #DB2777)" },
  cyan:   { label: "Ciano", primary: "#06B6D4", gradient: "linear-gradient(135deg, #22D3EE, #0891B2)" }
};

const CACHE_KEY = "ryn_preferences";

function loadCachedPreferences() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return { ...DEFAULT_PREFERENCES, ...JSON.parse(cached) };
  } catch { /* ignore */ }
  return DEFAULT_PREFERENCES;
}

function saveCachePreferences(prefs) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export function PreferencesProvider({ children, userId }) {
  const [preferences, setPreferences] = useState(loadCachedPreferences);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Carregar do Supabase quando userId estiver disponível
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data) {
          const prefs = {
            theme: data.theme || DEFAULT_PREFERENCES.theme,
            accent_color: data.accent_color || DEFAULT_PREFERENCES.accent_color,
            currency: data.currency || DEFAULT_PREFERENCES.currency,
            locale: data.locale || DEFAULT_PREFERENCES.locale,
            hide_values: data.hide_values ?? DEFAULT_PREFERENCES.hide_values,
            month_start_day: data.month_start_day ?? DEFAULT_PREFERENCES.month_start_day
          };
          setPreferences(prefs);
          saveCachePreferences(prefs);
        } else if (!error && !data) {
          // Criar registro com defaults
          await supabase.from("user_preferences").insert({
            user_id: userId,
            ...DEFAULT_PREFERENCES
          });
        }
      } catch { /* ignore network errors, use cache */ }

      if (!cancelled) {
        setLoading(false);
        setLoaded(true);
      }
    };

    fetchPreferences();
    return () => { cancelled = true; };
  }, [userId]);

  // Aplicar tema ao <html> sempre que mudar
  useEffect(() => {
    const applyTheme = (isDark) => {
      if (isDark) {
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
      }
    };

    if (preferences.theme === "auto") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mql.matches);
      const handler = (e) => applyTheme(e.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      applyTheme(preferences.theme === "dark");
    }
  }, [preferences.theme]);

  // Aplicar meta theme-color e variáveis CSS de cor de destaque
  useEffect(() => {
    const accent = ACCENT_COLORS[preferences.accent_color] || ACCENT_COLORS.purple;
    document.documentElement.style.setProperty("--ryn-primary", accent.primary);
    document.documentElement.style.setProperty("--ryn-primary-gradient", accent.gradient);

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const isDark = preferences.theme === "dark" || 
      (preferences.theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    meta.content = isDark ? "#0A0614" : "#F8F8FC";
  }, [preferences.theme, preferences.accent_color]);

  const updatePreference = useCallback(async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveCachePreferences(updated);

    if (userId) {
      try {
        await supabase
          .from("user_preferences")
          .update({ [key]: value })
          .eq("user_id", userId);
      } catch { /* ignore */ }
    }
  }, [preferences, userId]);

  const updatePreferences = useCallback(async (updates) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    saveCachePreferences(updated);

    if (userId) {
      try {
        await supabase
          .from("user_preferences")
          .update(updates)
          .eq("user_id", userId);
      } catch { /* ignore */ }
    }
  }, [preferences, userId]);

  const toggleHideValues = useCallback(() => {
    updatePreference("hide_values", !preferences.hide_values);
  }, [preferences.hide_values, updatePreference]);

  const isDark = preferences.theme === "dark" ||
    (preferences.theme === "auto" && 
      typeof window !== "undefined" && 
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const value = {
    preferences,
    loading,
    loaded,
    isDark,
    updatePreference,
    updatePreferences,
    toggleHideValues,
    accentColor: ACCENT_COLORS[preferences.accent_color] || ACCENT_COLORS.purple
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    // Fallback para uso fora do provider (não deveria acontecer)
    return {
      preferences: DEFAULT_PREFERENCES,
      loading: false,
      loaded: true,
      isDark: true,
      updatePreference: () => {},
      updatePreferences: () => {},
      toggleHideValues: () => {},
      accentColor: ACCENT_COLORS.purple
    };
  }
  return ctx;
}

export default PreferencesContext;
