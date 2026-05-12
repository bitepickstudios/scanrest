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
| Font | Geist Variable (fontsource CDN) |

---

## Routes

```
/                                           → Landing (placeholder)
/auth/login                                 → Owner login
/auth/register                              → Owner register
/auth/select-restaurant                     → Multi-restaurant picker

/admin/[restaurantSlug]                     → Admin home (stats)
/admin/[restaurantSlug]/profile             → Restaurant profile editor
/admin/[restaurantSlug]/menu                → Products & categories CRUD
/admin/[restaurantSlug]/tables              → Table/QR manager
/admin/[restaurantSlug]/orders              → Kanban board
/admin/[restaurantSlug]/reviews             → Reviews viewer

/[slug]?table=[table_id]                    → Storefront (mobile, QR entry)
/[slug]/order/[order_id]                    → Order tracker (horizontal stepper)
```

---

## Notes técnicas

- Next.js 16 renombró `middleware.ts` → `proxy.ts` (función `proxy`)
- Next.js 16 `params` es Promise: `const { slug } = await params`
- HeroUI v3 sin provider — solo `@import "@heroui/styles"` en globals.css
- Supabase publishable key = anon key, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Storage RLS: buckets públicos necesitan políticas en `storage.objects`
- Multi-tenant: URL drives slug; proxy syncs `current_restaurant_id` cookie para server actions
- HeroUI v3 Tabs full-width default — fix con `w-fit *:w-fit *:px-3`

---

## Data Model

```sql
restaurants (id, owner_id, name, slug, description, logo_url, cover_url,
             phone, whatsapp, email, instagram, facebook, tiktok, address,
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

## Phase 0 — Project Setup ✅

- [x] Deps: zustand, zod, react-hook-form, swr, @dnd-kit/*, qrcode, file-saver, @supabase/*, lucide-react
- [x] HeroUI v3 + Tailwind v4 + Geist Variable font
- [x] Supabase client/server helpers
- [x] Auth proxy
- [x] `lib/types.ts`

---

## Phase 1 — Database & Auth ✅

- [x] Schema SQL aplicado (10 tablas)
- [x] RLS en todas las tablas
- [x] Helper `owns_restaurant()` SECURITY DEFINER
- [x] Políticas: owner CRUD, anon INSERT en orders/reviews, public SELECT
- [x] Storage policies para `restaurant-images` y `product-images`
- [x] `/auth/login`, `/auth/register`
- [x] Email confirmation desactivado en dev

---

## Phase 2 — Admin Panel ✅

### 2a — Layout & Profile
- [x] Sidebar (Inicio, Perfil, Menú, Mesas, Pedidos, Reseñas, Cambiar local, Logout)
- [x] Stats reales en home admin
- [x] Profile form + upload logo/cover

### 2b — Menu Management
- [x] Categorías CRUD
- [x] Productos CRUD + toggle disponibilidad + upload imagen
- [x] Modificadores: grupos + opciones

### 2c — Table & QR Management
- [x] Bulk-add mesas
- [x] QR client-side, descarga PNG individual o todos
- [x] Toggle activo/inactivo
- [x] Modo foodcourt: QR único

### 2d — Multi-restaurant ownership
- [x] `/auth/select-restaurant` — picker de locales
- [x] URL refactor a `/admin/[restaurantSlug]/*`
- [x] Proxy sincroniza cookie de restaurante actual
- [x] Server actions scopean por `restaurant.id`

---

## Phase 3 — Storefront ✅

### 3a — Header
- [x] Cover + logo + nombre + descripción
- [x] Social chips con brand logos: WhatsApp, Instagram, Facebook, TikTok, email
- [x] Estrellas + cantidad de reseñas
- [x] Badge de modo

### 3b — Menu Browsing
- [x] Tabs categorías sticky con scroll horizontal (`w-fit`)
- [x] Cards producto
- [x] Modal detalle + selectores de modificadores
- [x] Radio (required) o checkbox (multi)
- [x] Selector cantidad

### 3c — Cart
- [x] Botón flotante con badge
- [x] Sheet con items, ajustar qty, nota por item

### 3d — Checkout
- [x] Form: nombre, teléfono, CI/RUC, nota
- [x] INSERT orders + items + modifiers
- [x] Redirect a tracker
- [x] Persiste active order en localStorage

### 3e — Order Tracker (rediseñado estilo Rappi/PedidosYa)
- [x] Stepper horizontal con barra de progreso animada
- [x] Ping pulse en step activo
- [x] Sticky back-to-menu top bar
- [x] CTA "Hacer otro pedido" → vuelve al storefront
- [x] Foodcourt: número grande con gradient
- [x] Poll cada 15s
- [x] Resumen del pedido
- [x] Live indicator
- [x] Auto-clear active order on `delivered`

### 3f — Active Order Banner
- [x] Floating bottom card en storefront
- [x] Polling cada 20s
- [x] Stack sobre cart button cuando hay items
- [x] Click → vuelve al tracker

---

## Phase 4 — Admin Kanban ✅

- [x] 4 columnas Nuevo / Preparando / Listo / Entregado
- [x] Cards con número, mesa/modo, cliente, items, tiempo
- [x] Drag entre columnas → UPDATE status
- [x] Modal detalle
- [x] Auto-refresh polling

---

## Phase 5 — Reviews ✅

- [x] Prompt post-entrega
- [x] Star picker + comentario → INSERT
- [x] Promedio real desde tabla
- [x] `/admin/[slug]/reviews` lista

---

## Phase 6 — Demo Data & Polish 🔄

- [x] Seed script: 4 restaurantes (`seed.sql`)
- [x] Skeletons HeroUI loading.tsx
- [x] not-found.tsx global + storefront + order
- [x] Geist Variable font global
- [x] Design tokens aplicados (--accent, --surface, --foreground)
- [x] Micro animaciones (fade-in, slide-up, ping, pulse)
- [x] Migration TikTok aplicada en código (falta correr SQL en prod)
- [ ] Audit visual mobile end-to-end
- [ ] Generar QRs reales para mesas demo (manual desde admin)

---

## Falta para shipping MVP a Vercel

### Bloqueantes
- [ ] **Migrations remotas** — correr en Supabase prod:
  - `migrations/add_tiktok.sql`
  - `seed.sql` (reemplazar `OWNER_ID_HERE`)
- [ ] **Vars Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **Reactivar email confirmation** en Supabase Auth (estaba off para dev)
- [ ] **Site URL + redirect URLs** en Supabase Auth → URL de Vercel
- [ ] **Storage CORS** confirmar que acepta dominio Vercel

### Nice-to-have pre-launch
- [ ] Landing page real en `/` (hoy es placeholder)
- [ ] Favicon + OG image + meta tags por restaurante
- [ ] Audit mobile real device (iOS Safari + Chrome Android)
- [ ] Probar flujo completo end-to-end con mesa real + QR físico
- [ ] Limpiar `console.log`s y dead code
- [ ] Configurar Vercel Analytics o similar

### Post-MVP (out of scope)
- Pago digital (Bancard, transferencia)
- WhatsApp Business API notifications
- Staff roles / multi-user
- Kitchen printer
- Analytics avanzados
- Supabase Realtime (hoy polling)
- App nativa
