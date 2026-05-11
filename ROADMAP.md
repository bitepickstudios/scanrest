# ScanRest — MVP Roadmap

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| UI | HeroUI v3 + Tailwind CSS 4 |
| Skeletons | boneyard-js |
| State | Zustand |
| Validation | Zod + React Hook Form |
| Backend / DB / Auth / Storage | Supabase |
| Kanban | @dnd-kit/core + @dnd-kit/sortable |
| QR | qrcode + file-saver |
| Data fetching | SWR |
| Icons | lucide-react |

---

## Routes

```
/                              → Landing (marketing)
/auth/login                    → Owner login
/auth/register                 → Owner register

/dashboard                     → Admin home (stats)
/dashboard/profile             → Restaurant profile editor
/dashboard/menu                → Products & categories CRUD
/dashboard/tables              → Table/QR manager
/dashboard/orders              → Kanban board
/dashboard/reviews             → Reviews viewer

/[slug]?table=[table_id]       → Storefront (mobile, QR entry)
/[slug]/order/[order_id]       → Order status tracker
```

---

## Notes técnicas

- Next.js 16 renombró `middleware.ts` → `proxy.ts` (función `proxy` en vez de `middleware`)
- Next.js 16 `params` es Promise: `const { slug } = await params`
- HeroUI v3 no necesita provider — solo importar `@heroui/styles` en globals.css
- Supabase publishable key = anon key, usar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Storage RLS: buckets públicos necesitan políticas explícitas en `storage.objects`

---

## Data Model

```sql
restaurants (id, owner_id, name, slug, description, logo_url, cover_url,
             phone, whatsapp, email, instagram, facebook, address,
             mode [table|foodcourt], active, created_at)

tables (id, restaurant_id, number, label, qr_url, active)

categories (id, restaurant_id, name, sort_order)

products (id, restaurant_id, category_id, name, description,
          price, image_url, available, sort_order)

modifier_groups (id, product_id, name, required, max_selections)

modifiers (id, group_id, name, price_delta)

orders (id, restaurant_id, table_id, order_number, customer_name,
        customer_phone, customer_ci, mode, status [new|preparing|ready|delivered],
        notes, created_at, updated_at)

order_items (id, order_id, product_id, product_name, quantity, unit_price, notes)

order_item_modifiers (id, order_item_id, modifier_name, price_delta)

reviews (id, restaurant_id, customer_name, rating, comment, created_at)
```

---

## Phase 0 — Project Setup ✅ COMPLETA

- [x] Deps instalados: zustand, zod, react-hook-form, swr, @dnd-kit/core, @dnd-kit/sortable, qrcode, file-saver, @supabase/supabase-js, @supabase/ssr, lucide-react
- [x] HeroUI v3 configurado (globals.css → `@import "@heroui/styles"`)
- [x] Supabase client/server (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [x] Auth proxy (`proxy.ts`) protege `/dashboard/*`, redirige `/auth/*` si ya logueado
- [x] Estructura de carpetas completa
- [x] `lib/types.ts` con todos los tipos del dominio

---

## Phase 1 — Database & Auth ✅ COMPLETA

- [x] Schema SQL aplicado en Supabase (10 tablas)
- [x] RLS habilitado en todas las tablas
- [x] Helper `owns_restaurant()` con SECURITY DEFINER
- [x] Políticas RLS: owner CRUD, anon INSERT en orders/reviews, public SELECT
- [x] Políticas Storage para `restaurant-images` y `product-images`
- [x] `/auth/login` — email + password → redirect /dashboard
- [x] `/auth/register` — crea cuenta + fila en restaurants → redirect /dashboard
- [x] Email confirmation: desactivado en dev (reactivar para prod)

---

## Phase 2 — Admin Panel ✅ COMPLETA

### 2a — Layout & Profile ✅
- [x] Dashboard shell con sidebar (Inicio, Perfil, Menú, Mesas, Pedidos, Reseñas, Logout)
- [x] Stats reales en /dashboard (productos, mesas, pedidos totales)
- [x] `/dashboard/profile`: form completo + upload logo/cover a Supabase Storage

### 2b — Menu Management ✅
- [x] Categorías: crear, renombrar, eliminar
- [x] Productos: CRUD completo, toggle disponibilidad, upload imagen
- [x] Modificadores: grupos (required, max_selections) + opciones con price_delta

### 2c — Table & QR Management ✅
- [x] Agregar N mesas de una vez
- [x] QR generado client-side con `qrcode`, descarga PNG individual o todos
- [x] Toggle activo/inactivo por mesa
- [x] Modo foodcourt: QR único para el local

---

## Phase 3 — Storefront — Client View 🔄 EN CURSO

**Goal:** cliente escanea QR → pide sin instalar nada. Mobile-first, estilo PedidosYa.

### 3a — Restaurant Profile Header
- [ ] Cover image (full-width hero)
- [ ] Logo + nombre + descripción
- [ ] Social links: WhatsApp (wa.me), Instagram, Facebook, email
- [ ] Promedio de estrellas + cantidad de reseñas
- [ ] Badge de modo: "Pedido a mesa" / "Retiro en mostrador"

### 3b — Menu Browsing
- [ ] Tabs de categorías (sticky, scroll horizontal)
- [ ] Cards de producto: imagen, nombre, descripción truncada, precio
- [ ] Tap → modal con detalle completo + selectores de modificadores
- [ ] Modificadores: radio (required, single) o checkbox (multi)
- [ ] Botón "Agregar al carrito" con selector de cantidad

### 3c — Cart
- [ ] Botón flotante sticky-bottom con badge de cantidad
- [ ] Sheet/modal de carrito: items, modificadores, subtotal, ajustar qty
- [ ] Nota por item

### 3d — Checkout
- [ ] Formulario: nombre (req), teléfono (req), CI/RUC (opcional)
- [ ] Nota general del pedido
- [ ] Confirmar → INSERT orders + order_items + order_item_modifiers
- [ ] Redirect → `/[slug]/order/[order_id]`

### 3e — Order Status Tracker
- [ ] Stepper 4 fases estilo PedidosYa:
  - `new` → "Tu pedido fue recibido"
  - `preparing` → "Lo están preparando"
  - `ready` (foodcourt) → "Listo para retirar"
  - `ready` (table) → "Ya está en camino a tu mesa"
  - `delivered` → "¡Buen provecho!"
- [ ] Poll cada 15s con SWR `refreshInterval`
- [ ] Resumen del pedido + número grande (foodcourt)

---

## Phase 4 — Admin Kanban ⏳ PENDIENTE

- [ ] `/dashboard/orders`: 4 columnas Nuevo / Preparando / Listo / Entregado
- [ ] Cards con: número, mesa/modo, cliente, items, tiempo transcurrido
- [ ] Drag entre columnas → UPDATE status
- [ ] Refresh manual + auto-refresh cada 30s
- [ ] Modal de detalle del pedido
- [ ] Status update escribe `updated_at` (el cliente lo detecta via poll)

---

## Phase 5 — Reviews ⏳ PENDIENTE

- [ ] Prompt de reseña post-entrega en la página de estado
- [ ] Star picker + comentario → INSERT reviews
- [ ] Storefront: promedio real de estrellas desde tabla reviews
- [ ] `/dashboard/reviews`: lista con filtro por estrellas

---

## Phase 6 — Demo Data & Polish ⏳ PENDIENTE

- [ ] Seed script: 4–5 restaurantes demo con menús reales, modificadores, reseñas
- [ ] QRs generados para todas las mesas demo
- [ ] Audit mobile (storefront)
- [ ] Skeletons con boneyard-js en pantallas con fetch
- [ ] Estados de error (restaurante no encontrado, pedido no encontrado)
- [ ] Página 404

---

## Progreso

| Phase | Estado | Días reales |
|---|---|---|
| 0 Setup | ✅ Completa | 1 |
| 1 DB + Auth | ✅ Completa | 1 |
| 2 Admin Panel | ✅ Completa | 1 |
| 3 Storefront | 🔄 En curso | — |
| 4 Kanban | ⏳ Pendiente | — |
| 5 Reviews | ⏳ Pendiente | — |
| 6 Polish | ⏳ Pendiente | — |

---

## Out of Scope para MVP

- Pago digital (Bancard, transferencia)
- Notificaciones WhatsApp Business API
- Staff roles / multi-user por restaurante
- Impresión de ticket (kitchen printer)
- Analytics avanzados
- Supabase Realtime (Kanban usa polling)
- App nativa
