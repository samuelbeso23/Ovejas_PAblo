# Pablo Ovejas — Gestión ganadera

Aplicación móvil-first para gestión de ovejas (crotales) y control de gastos de explotación ganadera.

## Stack tecnológico

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Supabase** (base de datos y almacenamiento de imágenes)
- **Tesseract.js** (OCR)

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Configuración de Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto.
2. En **Settings > API** copia la URL y la clave `anon` (pública).

### 2. Variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar el esquema SQL

En el **SQL Editor** de Supabase, ejecuta el contenido de `database/schema.sql`.

**Si no se guardan datos** (listas, ovejas, gastos): ejecuta `database/fix-rls.sql` para desactivar RLS.

### 4. Crear buckets de almacenamiento

En **Storage** de Supabase, crea dos buckets públicos:

- `ear-tag-photos` — fotos de crotales
- `receipt-photos` — fotos de tickets

Configura ambos como ** públicos** para que las imágenes sean accesibles.

## Estructura del proyecto

```
/app
  /dashboard      — Resumen animales y gastos
  /scan-sheep     — Escaneo OCR de crotales
  /lists          — Listas de ovejas
  /lists/[id]     — Detalle de lista
  /expenses       — Listado de gastos
  /add-expense    — Añadir gasto (foto o manual)
  /settings       — Ajustes y categorías

/components       — Componentes reutilizables
/lib
  supabaseClient.ts
  ocrService.ts
/types
/database
  schema.sql
```

## Funcionalidades

### Escaneo de crotales (OCR)

1. Pulsa "Escanear oveja"
2. Abre la cámara y haz una foto al crotal
3. OCR detecta el número (ej: ES012345678901)
4. Confirma o edita
5. Selecciona la lista y guarda

### Listas de ovejas

- Crear, renombrar y eliminar listas
- Añadir ovejas (escaneo o manual)
- Buscar por número de crotal
- Ver total de animales por lista

### Control de gastos

- **Foto del ticket**: OCR detecta fecha, importe y comercio
- **Entrada manual**: formulario con categoría, importe, fecha, descripción
- Categorías editables en Ajustes

### Dashboard

- Resumen de animales por lista
- Resumen de gastos del mes actual por categoría

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Inicio con resúmenes |
| `/scan-sheep` | Escanear crotal |
| `/lists` | Listas de ovejas |
| `/lists/[id]` | Detalle de lista |
| `/expenses` | Gastos |
| `/add-expense` | Añadir gasto |
| `/settings` | Ajustes y categorías |

## Desarrollo

- **Mobile-first**: interfaz optimizada para móvil
- **Botones grandes**: uso con una mano
- **OCR**: Tesseract.js con filtrado de números largos para crotales
