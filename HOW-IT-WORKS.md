# ScanRest — Cómo funciona hoy

Snapshot del producto a 2026-06-08. Foco: identificar cuellos de botella y mejoras. Dos audiencias: **cliente final** (comensal) y **dueño/operador** (admin + mozo).

---

## 0. Modelo mental rápido

- **Restaurante** = marca/dueño. 1 owner (auth user).
- **Sucursal (branch)** = ubicación física. Cada restaurante tiene N branches (mínimo 1 default).
- **Zona** = sub-área de sucursal (Salón, Terraza, Barra). Optional.
- **Mesa** = pertenece a branch + zona. Tiene QR único + capacidad + estado (`available`/`occupied`/`billing`).
- **Sesión de mesa** = vida de mesa entre "se sienta cliente" y "se libera". Agrupa órdenes.
- **Orden** = pedido. Pertenece a branch + mesa + sesión + (opcional) mozo.
- **Staff** = `superadmin` / `admin` / `waiter`. Sin row staff → owner.
- **Catálogo** = `products` maestros del restaurante. `branch_products` override (precio + disponibilidad por sucursal).

URL pattern:
- Admin: `/admin/{restaurantSlug}/{branchSlug}/...`
- Storefront: `/{restaurantSlug}/{branchSlug}?table=<id>`
- Mozo: `/staff/{restaurantSlug}/{branchSlug}/...`

---

## 1. Cliente final (comensal con QR)

### 1.1 Entrada

1. Escanea QR en mesa → abre `/{rest}/{branch}?table=<tableId>`.
2. `TableRestorer` persiste `table_id` en localStorage (TTL 6h) para mantener mesa entre navegaciones.
3. Storefront renderiza menú con personalización del local (`data-theme`, `--accent`, `--menu-radius`, layout list/grid/columns).

### 1.2 Navegación menú

- Header: cover, logo, nombre, descripción, rating, social chips.
- Search sticky top filtra productos por texto.
- Tabs categorías sticky scroll horizontal.
- Sección **bestsellers** scroll horizontal.
- Cards producto con quick-add `+` (sin variantes) o abren modal (con variantes).
- `ProductModal`: imagen, descripción, modificadores (grupos + max_selections + required), cantidad, nota.
- Cards de productos ya en cart muestran check + lápiz + stepper inline.

### 1.3 Carrito y checkout

- Zustand store cart por restaurante.
- `CartSheet` (drawer): items + edit variantes + carrusel "También te puede gustar".
- Checkout en el mismo sheet: nombre (req), teléfono, CI, nota.
- Submit → INSERT `orders` + `order_items` + `order_item_modifiers`.
- Identidad cliente persiste en localStorage `scanrest:customer:<slug>` → auto-fill futuro.
- Si sesión de mesa tiene `bill_requested_at` → bloquea nueva orden.

### 1.4 Tracker post-pedido

- Redirect a `/{rest}/{branch}/order/{orderId}`.
- Stepper horizontal estilo Rappi: Nuevo → Preparando → Listo → Entregado.
- **Polling 20s** (sin realtime todavía).
- `ActiveOrderBanner` flotante en menú si hay orden activa.

### 1.5 Sesión de mesa visible al cliente

- `TableSessionPanel` (sticky card sobre el menú): agrega todas las órdenes de la sesión actual, muestra total.
- Botón **"Pedir cuenta"** → marca `bill_requested_at` en sesión. Mesa pasa a `billing`.
- Realtime suscrito a `table_sessions` + `orders by session_id`.

### 1.6 Otros flujos cliente

- **Reservas**: `/{rest}/{branch}/reservas` → form (nombre/tel/email/party_size/fecha+hora/zona/notas) → insert status `pending`. Confirmación visual.
- **Review post-entrega**: prompt en tracker tras `delivered` → star picker + comentario.

### Cuellos de botella cliente

- **Polling 20s** en tracker → demora UX percibida (no es realtime).
- **No hay pago online** — todo es "pedí, te confirma el local".
- **No hay split bill / propina** en checkout.
- **No notif WhatsApp/Push** cuando orden cambia a Listo.
- **Mesa persiste 6h** — si cliente vuelve al día siguiente puede ver mesa stale.
- **No multi-idioma**.
- **Sin login cliente** → historial pedidos imposible.

---

## 2. Mozo (waiter)

### 2.1 Entrada

- Login email/password → `/auth/post-login` decide ruta por rol → `/staff/{rest}/{branch}`.
- Tablet/teléfono optimizado.

### 2.2 Grid de mesas (`TableGrid`)

- HeroUI Card aspect-square por mesa.
- 3 estados color: `available` / `occupied` / `billing`.
- Chip danger "Cuenta · hace N min" cuando `bill_requested_at` existe.
- Tap mesa → `/staff/{rest}/{branch}/tables/{tableId}` (vista POS-ticket).

### 2.3 Vista POS por mesa (`TicketView`)

- Si mesa libre: form "Abrir mesa" (customer_name + party_size) → `openTableSessionAsWaiter`.
- Si mesa ocupada:
  - Header: nombre cliente, mozo, botón "Cerrar mesa" (DoorClosed icon).
  - Ticket: órdenes ya enviadas de la sesión.
  - HeroUI Tabs categorías.
  - Grid 2-col productos con imágenes (`ProductGridCard`).
  - `StaffProductModal`: variantes + nota → agrega a draft.
  - Botón flotante "Ver pedido · N · ₲X" → abre `CartSheet` drawer.
  - `CartSheet`: NumberField por línea + "Enviar a cocina" (`createWaiterOrder` con `source='waiter'`, `waiter_id`, `session_id`).

### 2.4 Cierre

- "Cerrar mesa" → `closeTableSession` (marca status `closed`, libera mesa).
- **No registra pago/método** — solo cierra.

### Cuellos de botella mozo

- **Sin realtime en TicketView** — usa `router.refresh`. Si cocina marca listo, mozo no se entera hasta refrescar.
- **Sin notif "cliente pidió cuenta"** — depende de mirar grid.
- **Sin asignación de mozos a zonas** activa en UI (`staff_zones` existe en DB pero no se filtra).
- **No hay vista "mis órdenes activas"** para el mozo.
- **No imprime ticket cocina**.
- **No cobro / arqueo / cierre Z**.

---

## 3. Dueño / Admin

### 3.1 Entrada

- Owner login → `/auth/post-login` → `/admin/{rest}/{branch}`.
- Multi-restaurante: `/auth/select-restaurant` picker.
- Onboarding: `/auth/onboarding` si no tiene restaurante.

### 3.2 Sidebar + BranchSwitcher

- Logo del local (no Scanrest).
- Dropdown branches accesibles (preserva URL tail al cambiar).
- Secciones según rol.

### 3.3 Dashboard (`/admin/{rest}/{branch}`)

- `DashboardHeader`: Select rango (Hoy/7d/30d/Mes/Personalizado con DateRangePicker).
- Stats: pedidos, ingresos, ticket promedio, etc.
- Tabs **Pedidos / Reservas** con counts + tablas contextuales.
- Botón **Exportar** → CSV via `/api/admin/.../orders/export`.

### 3.4 Pedidos (`/orders`)

- Toggle **Kanban / Tabla** (HeroUI Tabs).
- Kanban 4 columnas drag-and-drop (`@dnd-kit`): Nuevo / Preparando / Listo / Entregado.
- `OrderCard`: dot color, quick buttons avance status.
- Tabla (`OrdersTable`): vista densa + filtros.
- Auto-refresh polling.
- Modal detalle pedido.

### 3.5 Mesas (`/tables`)

- HeroUI Tabs **Mesas | Sesiones**.
- **Mesas**:
  - Toggle Grid/Lista.
  - SearchField (label, número, zona, cliente).
  - `TableCard` con status chip + customer + duración + lista órdenes + total + quick actions por estado (Habilitar / Habilitar para cliente / Cargar pedido / Liberar).
  - `QuickEnableModal` (stepper personas + nombre opcional).
  - `TableActionsModal` unificado: liberar / cobrar / habilitar / editar / QR / eliminar.
  - Realtime: `table_sessions` + `tables` + `orders` subscritos.
- **Sesiones**: historial 30d con métricas (avg duración, avg ticket, avg items) + tabla.

### 3.6 Reservas (`/reservations`)

- Kanban (pending / confirmed / seated / completed).
- Modal detalle + asignar mesa (filtra por capacity ≥ party_size + check overlap).
- Confirmar / Rechazar.

### 3.7 Reseñas (`/reviews`)

- Card+Avatar, fecha relativa, paginación 10/pág, stats globales.

### 3.8 Menú (restaurant-level, `/menu`)

- Categorías + productos CRUD + toggle disponibilidad + upload imagen.
- Modificadores: grupos + opciones.
- **Disponibilidad por sucursal**: `/menu/disponibilidad/[branchSlug]` (override `available` + `price_override`).

### 3.9 Perfil (`/profile`)

- Tabs:
  - **Información**: nombre, descripción, logo, cover, redes + mockup teléfono live (iframe storefront).
  - **Personalización menú**: dark/light, layout (list/grid/columns), rounded (sm/md/lg/full), accent color libre. Preview live via searchParams `_t/_l/_r/_a`.
  - **Sucursales**: CRUD branches (tipos: Local con mesas / Food court).
  - **Equipo**: CRUD staff (invitar, rol, branch, zonas, eliminar).

### 3.10 Zonas (`/zones`)

- CRUD zonas por branch.

### Cuellos de botella admin

- **Auto-refresh polling** en Kanban → no realtime puro.
- **Sin notif sonora** "nuevo pedido" / "cliente pidió cuenta" / "nueva reseña".
- **Sin analíticas** (top productos, heatmap, conversión QR→pedido).
- **Sin carga CSV** productos → onboarding manual lento.
- **Sin WhatsApp out** (notif cliente).
- **Sin payments / arqueo / cierre Z**.
- **Sin cocina view** dedicada (sin precios, sin datos cliente).
- **Sin filtros en Sesiones** (rango, mesa) ni export ni paginación → pendiente Fase 4 TODO.
- **Queries admin sin auditar** (paginación inconsistente, posible N+1).
- **Sin tutorial / driver.js** en onboarding.
- **Login Google** ausente.
- **Multi-restaurante por user** (no sucursales) sin pulir.

---

## 4. Infra / transversal

### Stack
- Next.js 16 + React 19 + TS
- HeroUI v3 + Tailwind v4
- Supabase (DB + Auth + Storage + Realtime)
- Zustand (cart), SWR (data fetching), @dnd-kit (kanban)
- qrcode + file-saver

### Realtime hoy
- ✅ `/admin/.../tables`: sessions + tables + orders.
- ✅ Storefront `TableSessionPanel`: sessions + orders.
- ❌ Tracker cliente (polling 20s).
- ❌ ActiveOrderBanner (polling 15s).
- ❌ Mozo TicketView (`router.refresh`).
- ❌ Admin Kanban orders (polling).
- ❌ Admin Reseñas / Reservas.

### Seguridad
- RLS en todas las tablas con `owns_branch()` + `staff_has_branch_access()` helpers SECURITY DEFINER.
- Storage: buckets `restaurant-images` y `product-images` con policies.
- ❌ Pendiente: audit completo con `get_advisors`, rate-limit endpoints públicos (reservas, reviews).

### Identidad cliente
- LocalStorage `scanrest:customer:<slug>` (nombre, tel, CI).
- No hay account real → cross-restaurante imposible.

### Deploy
- Vercel + Supabase.
- ❌ Pre-ship pendientes: migraciones prod, vars Vercel, site URL Auth, storage CORS, audit mobile real device.

---

## 5. Cuellos de botella priorizados (resumen ejecutivo)

| # | Cuello | Impacto | Effort |
|---|--------|---------|--------|
| 1 | Polling en tracker + kanban + mozo (no realtime) | Alto UX | Medio |
| 2 | Sin notif WhatsApp/Push cliente | Alto retención | Alto (Meta API + plantillas) |
| 3 | Sin analíticas reales en dashboard | Alto valor percibido owner | Medio |
| 4 | Sin payments online (Bancard) + arqueo | Bloquea verticales paga-antes | Alto |
| 5 | Sin cocina view dedicada | Operativo (privacidad/foco cocina) | Bajo |
| 6 | Sin carga CSV menú | Bloquea onboarding rápido | Bajo |
| 7 | Sesiones sin filtros/export/paginación | UX admin | Bajo (Fase 4 TODO) |
| 8 | Sin asignación mozos a zonas en UI activa | Operativo multi-mozo | Bajo |
| 9 | Sin login Google + multi-restaurante por user pulido | Conversión signup | Medio |
| 10 | Sin onboarding wizard + tutorial driver.js | Activation | Medio |
| 11 | Sin print ticket cocina (ESC/POS o CSS print) | Operativo cocina | Medio |
| 12 | Cliente sin login → sin historial cross-local | Estratégico fidelidad | Alto |
| 13 | Sin multi-idioma menú | Mercado turístico | Medio |
| 14 | Sin "llamar al mozo" desde storefront | UX comensal | Bajo |
| 15 | Sin propina/split bill checkout | Revenue | Bajo |

---

## 6. Atajos por persona

**Comensal escanea QR:**
QR → menú personalizado → carrito → checkout → tracker (polling) → notif local → review.

**Mozo abre turno:**
Login → grid mesas → tap mesa libre → abrir sesión → tabs categorías → producto → modal → cart → enviar cocina → repite → cerrar mesa.

**Dueño revisa día:**
Login → dashboard (rango, exportar) → pedidos kanban → mesas/sesiones → reservas → reseñas → menú/personalización.
