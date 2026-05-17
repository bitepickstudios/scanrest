# ScanRest — Roadmap

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

/admin/[restaurantSlug]                                    → Admin home (redirect a sucursal default)
/admin/[restaurantSlug]/profile                            → Restaurant profile editor
/admin/[restaurantSlug]/menu                               → Products & categories CRUD (catálogo maestro)
/admin/[restaurantSlug]/sucursales                         → Branches CRUD
/admin/[restaurantSlug]/settings/staff                     → Staff/roles (admin, waiter) + zonas asignadas
/admin/[restaurantSlug]/[branchSlug]                       → Branch home (stats sucursal)
/admin/[restaurantSlug]/[branchSlug]/zones                 → Zonas de la sucursal
/admin/[restaurantSlug]/[branchSlug]/tables                → Mesas/QR de la sucursal
/admin/[restaurantSlug]/[branchSlug]/menu-overrides        → Disponibilidad + price override por sucursal
/admin/[restaurantSlug]/[branchSlug]/orders                → Kanban pedidos sucursal
/admin/[restaurantSlug]/[branchSlug]/reservations          → Reservas Kanban
/admin/[restaurantSlug]/[branchSlug]/reviews               → Reseñas sucursal

/staff/[restaurantSlug]/[branchSlug]                       → Mozo PWA: grid de mesas
/staff/[restaurantSlug]/[branchSlug]/order/new?table=[id]  → Mozo PWA: tomar pedido

/[slug]/[branchSlug]?table=[table_id]                      → Storefront (mobile, QR entry, branch-scoped)
/[slug]/[branchSlug]/reservas                              → Reserva pública (formulario)
/[slug]/[branchSlug]/order/[order_id]                      → Order tracker
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
- Tailwind v4: utilidades custom via `@utility name { ... }` en globals.css
- Mesa persistente: `lib/active-table.ts` localStorage TTL 6h, `TableRestorer` client component bridge

---

## Data Model

```sql
restaurants (id, owner_id, name, slug, description, logo_url, cover_url,
             phone, whatsapp, email, instagram, facebook, tiktok, address,
             mode [table|foodcourt], active, created_at)

branches (id, restaurant_id, name, slug, type [restaurant|foodpark_stall],
          address, phone, is_default, active, created_at)
zones (id, branch_id, name, sort_order)
tables (id, restaurant_id, branch_id, zone_id, number, label, capacity, qr_url, active)
staff (id, restaurant_id, user_id, role [superadmin|admin|waiter],
       display_name, branch_id, active, created_at)
staff_zones (staff_id, zone_id)  -- waiter ↔ zonas asignadas
branch_products (branch_id, product_id, available, price_override)  -- overrides menú por sucursal
reservations (id, branch_id, table_id, zone_id, customer_name, customer_phone,
              customer_email, party_size, reservation_at, duration_minutes,
              status [pending|confirmed|seated|completed|cancelled|rejected|no_show],
              approved_by, approved_at, notes, created_at)
categories (id, restaurant_id, name, sort_order)
products (id, restaurant_id, category_id, name, description,
          price, image_url, available, sort_order)
modifier_groups (id, product_id, name, required, max_selections)
modifiers (id, group_id, name, price_delta)
orders (id, restaurant_id, branch_id, table_id, order_number, customer_name,
        customer_phone, customer_ci, mode, status [new|preparing|ready|delivered],
        source [storefront|waiter], waiter_id, wants_invoice, ruc, razon_social,
        notes, created_at, updated_at)
order_items (id, order_id, product_id, product_name, quantity, unit_price, notes)
order_item_modifiers (id, order_item_id, modifier_name, price_delta)
reviews (id, restaurant_id, customer_name, rating, comment, created_at)
```

---

# COMPLETADO ✅

## Phase 0 — Project Setup ✅

- [x] Deps: zustand, zod, react-hook-form, swr, @dnd-kit/*, qrcode, file-saver, @supabase/*, lucide-react
- [x] HeroUI v3 + Tailwind v4 + Geist Variable font
- [x] Supabase client/server helpers
- [x] Auth proxy
- [x] `lib/types.ts`

## Phase 1 — Database & Auth ✅

- [x] Schema SQL aplicado (10 tablas)
- [x] RLS en todas las tablas
- [x] Helper `owns_restaurant()` SECURITY DEFINER
- [x] Políticas: owner CRUD, anon INSERT en orders/reviews, public SELECT
- [x] Storage policies `restaurant-images` y `product-images`
- [x] `/auth/login`, `/auth/register`
- [x] Email confirmation off en dev

## Phase 2 — Admin Panel ✅

- [x] Layout + sidebar
- [x] Stats reales home admin
- [x] Profile form + upload logo/cover
- [x] Categorías + productos CRUD + toggle disponibilidad + upload imagen
- [x] Modificadores: grupos + opciones
- [x] Bulk-add mesas + QR descarga PNG
- [x] Toggle activo/inactivo mesas
- [x] Modo foodcourt: QR único
- [x] `/auth/select-restaurant` multi-restaurant picker
- [x] URL refactor a `/admin/[restaurantSlug]/*`
- [x] Proxy cookie current restaurant
- [x] Server actions scopean por `restaurant.id`

## Phase 3 — Storefront ✅

- [x] Header: cover, logo, nombre, descripción, social chips, rating
- [x] Tabs categorías sticky scroll horizontal
- [x] Cards producto + modal detalle con selectores modificadores
- [x] Selector cantidad
- [x] Carrito flotante + sheet
- [x] Checkout (nombre/tel/CI/nota) + INSERT orders+items+modifiers
- [x] Order Tracker estilo Rappi (stepper horizontal, ping, progreso)
- [x] Active order banner flotante con polling 20s
- [x] Mesa visible en todo el flujo

## Phase 4 — Admin Kanban ✅

- [x] 4 columnas Nuevo / Preparando / Listo / Entregado
- [x] Drag entre columnas → UPDATE status
- [x] Modal detalle pedido
- [x] Auto-refresh polling

## Phase 5 — Reviews ✅

- [x] Prompt post-entrega
- [x] Star picker + comentario → INSERT
- [x] Promedio real desde tabla
- [x] `/admin/[slug]/reviews` lista

## Phase 6 — Polish Demo ✅

- [x] Seed script (4 restaurantes)
- [x] Skeletons + not-found pages
- [x] Geist Variable font
- [x] Design tokens (--accent, --surface, --foreground)
- [x] Micro animaciones
- [x] Multi-restaurant URL refactor
- [x] Order tracker rediseñado

## Phase 7 — Storefront UX upgrade ✅

- [x] PDP modal: padding fix bottom bar + safe-area inset
- [x] Cart sheet: imagen, descripción, edit variantes, lock body scroll
- [x] Carrusel "También te puede gustar" en cart
- [x] Search bar sticky top con filtrado
- [x] Quick-add `+` en product card (con/sin variantes)
- [x] Estado "en cart": check + lápiz + stepper inline
- [x] Sección bestsellers horizontal scroll
- [x] QuantityStepper unificado (1 diseño global)
- [x] ProductCard reusable (compact + full)
- [x] Mesa persistente vía localStorage + TTL 6h (`TableRestorer`)
- [x] `scrollbar-hide` utility global

## Phase 8 — Multi-Sucursales + Roles + Mozos + Reservas ✅

- [x] Schema: `branches`, `zones`, `staff` (con roles), `staff_zones`, `branch_products`, `reservations`
- [x] `tables` con `branch_id`, `zone_id`, `capacity`
- [x] `orders` con `branch_id`, `source` (storefront|waiter), `waiter_id`, `wants_invoice`, `ruc`, `razon_social`
- [x] Helpers SECURITY DEFINER: `owns_branch()`, `staff_has_branch_access()`
- [x] Routing refactor: `/admin/[rest]/[branch]/*`, `/[slug]/[branchSlug]/*`, `/staff/[rest]/[branch]/*`
- [x] `getRestaurantWithBranch`, `getCurrentStaffRole`, `listBranchesForRestaurant`
- [x] Admin: BranchesManager, ZonesManager, TablesManager (con zona/capacidad), MenuOverridesManager, StaffManager
- [x] BranchSwitcher en Sidebar (preserva URL tail al cambiar sucursal)
- [x] Mozo PWA: TableGrid + OrderTaker (search/categorías/checkout con factura RUC)
- [x] `createWaiterOrder` server action
- [x] Reservas: form storefront (`/[slug]/[branchSlug]/reservas`) + Kanban admin con overlap check
- [x] Seed: branches + zones + capacity por mesa

---

# PENDIENTE 🚧

## Pre-ship MVP (bloqueantes)

- [ ] Correr `migrations/add_tiktok.sql` en Supabase prod
- [ ] Correr `seed.sql` (reemplazar `OWNER_ID_HERE`)
- [ ] Vars Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Reactivar email confirmation Supabase Auth
- [ ] Site URL + redirect URLs Supabase Auth → Vercel
- [ ] Storage CORS dominio Vercel
- [ ] Audit mobile real device (iOS Safari + Chrome Android)
- [ ] Probar flujo end-to-end con QR físico
- [ ] Limpiar console.logs

---

## P0 — Antes de vender al primer cliente

Necesario para producto autoservicio real.

- [ ] **Realtime Supabase para estado pedido**
  - Reemplazar polling 15s/20s en OrderTracker y ActiveOrderBanner
  - `supabase.channel().on('postgres_changes', { event: 'UPDATE', table: 'orders' })`
  - Fallback polling si websocket falla
- [ ] **Onboarding self-serve crear restaurante**
  - Wizard post-signup: nombre, slug, modo, contacto básico
  - Skip a admin home tras crear
  - Sin esto no hay registro autoservicio
- [ ] **Landing page real en `/`**
  - Hero + features + CTA signup
  - Sección "Cómo funciona" 3 pasos
  - Pricing (aunque sea "free hasta X pedidos/mes")
  - Footer con links

---

## P1 — Primeros 5-10 clientes

Cosas que el dueño pide día 2.

- [ ] **Notificaciones WhatsApp via número scanrest**
  - WhatsApp Cloud API (Meta) — 1 número scanrest, plantillas aprobadas
  - Trigger en update `orders.status` → edge function → API
  - Plantillas: "listo para retirar", "preparando", etc.
  - Tabla `notifications_log` para auditar envíos
- [ ] **Analíticas ventas básicas**
  - Top productos / categorías
  - Ventas por día/hora (heatmap)
  - Ticket promedio
  - Conversión (visitas QR → pedidos)
  - Gráficos en `/admin/[slug]` home (reemplazar stats actuales)
- [ ] **Carga productos por CSV**
  - Plantilla descargable
  - Upload + preview + validación Zod
  - Crear/upsert categorías inferidas
  - Skip rows con error
- [ ] **Edición estilos storefront**
  - Color primario (accent picker)
  - Tipografía (3-4 opciones curadas)
  - Logo grande/chico, fondo blanco/oscuro
  - Preview live
  - Tabla `restaurant_theme` o columnas en `restaurants`
- [ ] **Optimizar UI admin**
  - Audit visual completo
  - Estados loading consistentes
  - Mobile admin (mozos en tablet/teléfono)
- [ ] **Llamar al mozo desde storefront**
  - Botón flotante "Necesito ayuda" / "Traer cuenta"
  - Tabla `table_calls (id, table_id, type, created_at, resolved_at)`
  - Notif en admin Kanban + sonido

---

## P2 — Con tracción (10-50 clientes)

- [ ] **Roles staff (Admin / Cocina / Mozo)**
  - Tabla `restaurant_staff (user_id, restaurant_id, role)`
  - RLS por rol
  - Cocina: solo Kanban, sin precios/datos cliente
  - Mozo: Kanban + mesas + llamadas + cobro
- [ ] **Tip/propina configurable checkout**
  - Sugerencias 10/15/20% + custom
  - Persistir en `orders.tip_amount`
- [ ] **Dividir cuenta (split bill)**
  - En tracker: "Dividir entre N comensales"
  - Genera links únicos por comensal con monto parcial
  - Solo display; el pago real depende de Bancard P2
- [ ] **Pre-pedido / agendar hora**
  - En storefront: toggle "ahora" vs "agendar"
  - `orders.scheduled_for` timestamp
  - Validar horarios apertura (nueva config `restaurant_hours`)
- [ ] **Reservas mesa**
  - Tabla `reservations (id, restaurant_id, customer_name, phone, party_size, scheduled_for, status, table_id?)`
  - Storefront: botón "Reservar mesa"
  - Admin: lista + confirmar/rechazar
- [ ] **Sistema "mesa lista" (lista espera virtual)**
  - Cliente se anota afuera del local
  - Tabla `waitlist`
  - Cuando admin libera mesa → ping (WhatsApp/SMS)
- [ ] **Customer profile sin login**
  - Lookup por teléfono+CI
  - Historial pedidos personal (cualquier local scanrest)
  - Página pública `/me/[phone]` con OTP corto vía WhatsApp
- [ ] **Multi-idioma menú (ES/EN/PT)**
  - Columnas `name_en`, `name_pt`, `description_en/pt` o tabla `product_translations`
  - Selector idioma en storefront header
  - Auto-detect via `Accept-Language`
- [ ] **Impresora térmica ticket cocina**
  - Print web (CSS print + 80mm width)
  - O integración ESC/POS via PrintNode/QZ Tray
  - Auto-imprime al pasar a "preparando"
- [ ] **Promociones / cupones**
  - Tabla `coupons (code, type, value, min_amount, expires_at, usage_limit)`
  - Storefront checkout: campo código
  - Admin: gestión + estadísticas uso
- [ ] **Ingredientes / calorías / tags dietarios**
  - Columnas `ingredients`, `calories`, `tags[]` (vegano/gluten-free/etc)
  - Filtros en storefront
- [ ] **Sucursales (multi-location)**
  - Tabla `branches` o `restaurants.parent_id`
  - Admin: switcher sucursal
  - Storefront: selector ubicación si hay >1
- [ ] **Pasarela Bancard online**
  - KYC por comercio
  - Webhook confirmación pago → marca order paid
  - Split commission scanrest
  - Compliance + reconciliación

---

## P3 — Long term / Estratégicos

- [ ] **Sugerencias IA en storefront**
  - Cliente pregunta "qué me recomendas, algo salado rico y barato"
  - Endpoint con Claude/GPT + contexto menú + reseñas
  - UI: input estilo chat dentro del menú
- [ ] **Sistema fidelidad cross-restaurant**
  - Cliente final se registra
  - Pedido + reseña en cualquier local scanrest → entrada sorteo mensual
  - Vale canjeable en cualquier local adherido
  - Requiere masa crítica ≥20 locales
- [ ] **Mozos asignados a mesas/zonas**
  - Tablas `zones`, `table_zone_assignments`, `staff_zone_assignments`
  - Mozo solo ve pedidos de su zona
- [ ] **Marketplace público**
  - `scanrest.com/asuncion` → lista locales adheridos
  - SEO city pages
  - Adquisición clientes finales
- [ ] **API REST para ERPs**
  - OAuth2 + scopes
  - Endpoints orders, products, categories
  - Webhooks salientes (POST a URL del comercio en status change)
- [ ] **App nativa o PWA instalable**
  - PWA + Add to Home Screen prompt
  - Habilita Web Push en iOS

---

## Ideas backlog (sin fecha)

- Modo pre-pago (paga antes de cocinar; cero no-show)
- Caja / cierre Z diario + arqueo
- Reseñas con foto + moderación
- Logs auditoría
- Inventario / stock con auto-decrement
- Bulk QR generation: PDF con todas las mesas + branding
- Modo offline parcial cocina
- NFC alternativo a QR
- Dark mode storefront
- Apple/Google Wallet loyalty card
- Programa referidos entre restaurantes
- Compatibilidad multi-currency / impuestos por país
- Webhooks salientes (antes que API REST completa)
