import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

console.log("SUPABASE URL →", url);

if (!url || !key) {
  console.error("Supabase: variáveis de ambiente não configuradas.");
}

export const supabase = createClient(url, key);
