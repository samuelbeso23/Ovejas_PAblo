-- Si no se guardan datos: ejecutar este SQL en Supabase SQL Editor
-- Desactiva RLS para permitir todas las operaciones (sin autenticación)

ALTER TABLE IF EXISTS sheep_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sheep DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
