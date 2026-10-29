-- ============================================================
-- Migration 002: custom_categories
-- Tabela para categorias personalizadas do usuário
-- Idempotente: pode ser executado múltiplas vezes sem erro
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#64748b',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_user_id ON custom_categories(user_id);

-- Habilitar RLS
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own categories" ON custom_categories;
  CREATE POLICY "Users can view own categories" ON custom_categories
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert own categories" ON custom_categories;
  CREATE POLICY "Users can insert own categories" ON custom_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own categories" ON custom_categories;
  CREATE POLICY "Users can update own categories" ON custom_categories
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own categories" ON custom_categories;
  CREATE POLICY "Users can delete own categories" ON custom_categories
    FOR DELETE USING (auth.uid() = user_id);
END $$;
