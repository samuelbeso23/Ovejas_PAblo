-- Pablo Ovejas - Supabase Schema
-- Ejecutar en el SQL Editor de Supabase

-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: sheep_lists (listas de ovejas)
CREATE TABLE IF NOT EXISTS sheep_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: sheep (ovejas)
CREATE TABLE IF NOT EXISTS sheep (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ear_tag_number VARCHAR(50) NOT NULL,
  list_id UUID NOT NULL REFERENCES sheep_lists(id) ON DELETE CASCADE,
  photo_url TEXT,
  date_added DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: expense_categories (categorías de gastos)
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: expenses (gastos)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  receipt_photo TEXT,
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sheep_list_id ON sheep(list_id);
CREATE INDEX IF NOT EXISTS idx_sheep_ear_tag ON sheep(ear_tag_number);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- RLS: Políticas para permitir acceso (ejecutar si no se guardan datos)
-- Si falla, prueba: ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all sheep_lists" ON sheep_lists;
ALTER TABLE sheep_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all sheep_lists" ON sheep_lists FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all sheep" ON sheep;
ALTER TABLE sheep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all sheep" ON sheep FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all expense_categories" ON expense_categories;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all expense_categories" ON expense_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all expenses" ON expenses;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Insertar categorías de gasto por defecto (ejecutar solo una vez tras crear tablas)
INSERT INTO expense_categories (name, sort_order) VALUES
  ('Abono', 1),
  ('Fertilizantes', 2),
  ('Gasoil', 3),
  ('Semillas', 4),
  ('Veterinario', 5),
  ('Alimentación', 6),
  ('Reparaciones', 7),
  ('Otros', 99);

-- Storage buckets (ejecutar en Supabase Dashboard > Storage o via API)
-- Bucket: ear-tag-photos (public)
-- Bucket: receipt-photos (public)
