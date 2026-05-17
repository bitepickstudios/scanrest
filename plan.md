Plan actualizado con sección "Herramientas obligatorias" arriba de archivos críticos: Supabase MCP (apply_migration,
  list_tables, get_advisors, generate_typescript_types, execute_sql, get_logs) + HeroUI MCP (list_components,
  get_component_docs, get_component_source_code) antes de cualquier componente. Verification section también referencia
  MCPs por nombre.

● User approved Claude's plan
  ⎿  Plan saved to: ~\.claude\plans\noble-skipping-umbrella.md · /plan to edit
     Plan — Sucursales, Roles, Mozos, Reservas, Zonas

     Context

     ScanRest hoy modela todo a nivel restaurant_id: mesas, productos, órdenes, reviews. No existe concepto de sucursal,
      zona, staff/rol, ni reservas. El usuario necesita operar restaurantes con múltiples sucursales (ej. food parks,
     cadenas locales), cada una con sus propias mesas/zonas/mozos/órdenes, compartiendo branding y catálogo maestro.
     Además, mozos toman pedidos desde tablet en mesa, y clientes pueden reservar vía QR.

     Decisiones confirmadas:
     - URL admin: /admin/{restSlug}/{branchSlug}/*
     - URL storefront: scanrest.app/{restSlug}/{branchSlug} (+ /reservas)
     - Menú: catálogo maestro en products + tabla branch_products con overrides (availability, price_override)
     - Login mozo: /auth/login único, post-auth routea por rol
     - Reservas: solicitud → admin aprueba (pending → confirmed/rejected)
     - Mozos ↔ zonas: many-to-many vía staff_zones
     - Stock: out of scope esta tanda (columna preparada, lógica diferida)

     Fases

     Implementación en 6 fases. Cada una mergea funcional sin romper la siguiente.

     ---
     Fase 1 — Schema (migration única)

     Archivo: supabase/migrations/0001_branches_staff_reservations.sql (carpeta nueva).

     -- ENUMS
     create type staff_role as enum ('superadmin', 'admin', 'waiter');
     create type reservation_status as enum ('pending', 'confirmed', 'rejected', 'cancelled', 'seated', 'completed',
     'no_show');
     create type branch_type as enum ('standalone', 'foodpark_stall');

     -- BRANCHES
     create table branches (
       id uuid primary key default gen_random_uuid(),
       restaurant_id uuid not null references restaurants(id) on delete cascade,
       slug text not null,
       name text not null,
       address text,
       phone text,
       type branch_type default 'standalone',
       is_default boolean default false,
       active boolean default true,
       created_at timestamptz default now(),
       unique (restaurant_id, slug)
     );
     create index on branches (restaurant_id);

     -- ZONES (salón, terraza, barra, VIP) — por sucursal
     create table zones (
       id uuid primary key default gen_random_uuid(),
       branch_id uuid not null references branches(id) on delete cascade,
       name text not null,
       sort_order int default 0,
       created_at timestamptz default now()
     );
     create index on zones (branch_id);

     -- TABLES (alter existing): agregar branch_id, zone_id, capacity
     alter table tables add column branch_id uuid references branches(id) on delete cascade;
     alter table tables add column zone_id uuid references zones(id) on delete set null;
     alter table tables add column capacity int default 4;
     -- restaurant_id se queda (cache de denormalización, útil para queries cross-branch)
     create index on tables (branch_id);

     -- BRANCH PRODUCTS (overrides menú maestro)
     create table branch_products (
       branch_id uuid not null references branches(id) on delete cascade,
       product_id uuid not null references products(id) on delete cascade,
       available boolean default true,
       price_override integer, -- null = usa products.price
       stock integer, -- preparado, no usado todavía
       primary key (branch_id, product_id)
     );
     create index on branch_products (product_id);

     -- STAFF (perfil + rol)
     create table staff (
       id uuid primary key default gen_random_uuid(),
       user_id uuid not null references auth.users(id) on delete cascade,
       restaurant_id uuid not null references restaurants(id) on delete cascade,
       branch_id uuid references branches(id) on delete cascade, -- null = restaurant-level
       role staff_role not null,
       display_name text,
       active boolean default true,
       created_at timestamptz default now(),
       unique (user_id, restaurant_id, branch_id)
     );
     create index on staff (user_id);
     create index on staff (branch_id);

     -- STAFF ↔ ZONES (mozo cubre N zonas)
     create table staff_zones (
       staff_id uuid not null references staff(id) on delete cascade,
       zone_id uuid not null references zones(id) on delete cascade,
       primary key (staff_id, zone_id)
     );

     -- ORDERS: agregar branch_id, waiter_id, ruc, razon_social, billing
     alter table orders add column branch_id uuid references branches(id) on delete cascade;
     alter table orders add column waiter_id uuid references staff(id) on delete set null;
     alter table orders add column source text default 'qr' check (source in ('qr','waiter','reservation'));
     alter table orders add column ruc text;
     alter table orders add column razon_social text;
     alter table orders add column wants_invoice boolean default false;
     create index on orders (branch_id, status);

     -- RESERVATIONS
     create table reservations (
       id uuid primary key default gen_random_uuid(),
       branch_id uuid not null references branches(id) on delete cascade,
       table_id uuid references tables(id) on delete set null,
       zone_id uuid references zones(id) on delete set null,
       customer_name text not null,
       customer_phone text not null,
       customer_email text,
       party_size int not null check (party_size > 0),
       reservation_at timestamptz not null,
       duration_minutes int default 90,
       status reservation_status default 'pending',
       notes text,
       approved_by uuid references staff(id) on delete set null,
       approved_at timestamptz,
       created_at timestamptz default now()
     );
     create index on reservations (branch_id, reservation_at);
     create index on reservations (status);

     -- REVIEWS: agregar branch_id (mover scope)
     alter table reviews add column branch_id uuid references branches(id) on delete set null;

     -- BACKFILL: crear branch "Principal" por restaurante existente, asignar tables/orders/reviews
     do $$
     declare r record;
     declare new_branch_id uuid;
     begin
       for r in select id from restaurants loop
         insert into branches (restaurant_id, slug, name, is_default)
         values (r.id, 'principal', 'Principal', true)
         returning id into new_branch_id;

         update tables set branch_id = new_branch_id where restaurant_id = r.id;
         update orders set branch_id = new_branch_id where restaurant_id = r.id;
         update reviews set branch_id = new_branch_id where restaurant_id = r.id;
       end loop;
     end $$;

     -- Una vez backfilled, hacer NOT NULL
     alter table tables alter column branch_id set not null;
     alter table orders alter column branch_id set not null;

     RLS policies nuevas:

     Helper owns_branch(branch_uuid) SECURITY DEFINER que valida vía branches→restaurants.owner_id.

     Helper staff_has_access(branch_uuid, min_role) que chequea staff row + role precedencia.

     - branches: superadmin/owner CRUD; público SELECT cuando active=true
     - zones: staff con acceso a branch
     - branch_products: staff con acceso (admin+); público SELECT
     - staff: superadmin CRUD; user puede SELECT su propia row
     - staff_zones: superadmin/admin CRUD
     - orders: anon INSERT cuando branch.active; waiter de la branch INSERT; staff de la branch SELECT/UPDATE
     - reservations: anon INSERT (status forzado a pending); staff de branch SELECT/UPDATE

     Owner del restaurants.owner_id es implícitamente superadmin (no requiere row en staff).

     ---
     Fase 2 — Routing refactor ✅ COMPLETADA (commit bb9ed5c)

     Admin (mover de app/(admin)/admin/[restaurantSlug]/* a anidado con branch):

     app/(admin)/admin/[restaurantSlug]/
     ├── layout.tsx                          → si 0 branches activas, redirect onboarding branch
     ├── page.tsx                            → si 1 branch redirect a /admin/{rest}/{branch}; si 2+ branch picker
     ├── sucursales/page.tsx                 → lista + crear (superadmin only)
     ├── sucursales/[branchSlug]/page.tsx    → editar sucursal
     ├── settings/staff/page.tsx             → CRUD staff (superadmin)
     ├── menu/page.tsx                       → menú maestro (restaurant-level)
     └── [branchSlug]/
         ├── layout.tsx                      → resuelve branch, valida acceso (staff_has_access)
         ├── page.tsx                        → dashboard branch (stats branch-scoped)
         ├── orders/page.tsx                 → Kanban branch-scoped
         ├── tables/page.tsx                 → mesas + zonas + capacidad
         ├── zones/page.tsx                  → CRUD zonas
         ├── menu-overrides/page.tsx         → availability + price_override por producto
         ├── reservations/page.tsx           → Kanban reservations (pending/confirmed/...)
         └── reviews/page.tsx

     lib/current-restaurant.ts → expandir con getCurrentBranch(restSlug, branchSlug) que retorna { restaurant, branch,
     role } y valida acceso. Sidebar branch dropdown switcher.

     Storefront:
     app/(storefront)/[slug]/
     ├── page.tsx                            → si tiene 1 branch redirect /{slug}/{default}; si 2+, branch picker
     └── [branchSlug]/
         ├── page.tsx                        → menú (lee branch_products override)
         ├── order/[orderId]/page.tsx        → tracker (existing, branch-aware)
         └── reservas/page.tsx               → form pública crear reserva

     lib/active-table.ts, lib/active-order.ts → key incluir branchId.

     Staff (mozo):
     app/(staff)/staff/[restaurantSlug]/[branchSlug]/
     ├── layout.tsx                          → valida role=waiter
     ├── page.tsx                            → grid mesas (libres/ocupadas) + buscador rápido
     ├── order/new/page.tsx                  → flow take order (mesa → menú buscador → datos cliente → confirmar)
     └── orders/page.tsx                     → mis pedidos activos

     Auth post-login routing (/auth/login y /auth/register redirect targets):
     - Nueva ruta server app/auth/post-login/route.ts que decide:
       - Owner de restaurants → si 0 → onboarding; 1 rest+1 branch → /admin/{rest}/{branch}; multi →
     /auth/select-restaurant
       - Staff row admin → /admin/{rest}/{branch}
       - Staff row waiter → /staff/{rest}/{branch}
     - Reemplazar redirects actuales a /auth/select-restaurant por /auth/post-login.

     ---
     Fase 3 — Admin UI (sucursales, staff, zonas, mesas, overrides)

     Componentes nuevos en components/admin/:

     - BranchSwitcher.tsx — dropdown HeroUI en sidebar, lista branches accesibles, link a "Gestionar sucursales"
     - BranchesManager.tsx — tabla branches + modal crear/editar (superadmin)
     - StaffManager.tsx — invita usuario (email → crea auth user con password temp o magic link), asigna role + branch +
      zones
     - ZonesManager.tsx — CRUD zonas por branch
     - TablesManager.tsx (modificar existing) — agregar zone_id select + capacity
     - MenuOverridesManager.tsx — lista productos maestros, toggle available + input price_override por branch
     - Sidebar (components/admin/Sidebar.tsx): inyecta sección branch dinámica + BranchSwitcher

     Server actions nuevas en lib/actions/:

     - branches.ts: createBranch, updateBranch, deleteBranch, setDefaultBranch
     - staff.ts: inviteStaff, updateStaffRole, deactivateStaff, assignZones
     - zones.ts: createZone, updateZone, deleteZone, reorderZones
     - branch-products.ts: setProductAvailability, setProductPriceOverride, bulkUpdateOverrides
     - tables.ts (modificar): createTables acepta branch_id, zone_id, capacity
     - reservations.ts: approveReservation, rejectReservation, markSeated, markNoShow

     Cookie + helpers: extender CURRENT_RESTAURANT_COOKIE con current-branch o usar URL como single source.

     ---
     Fase 4 — Mozo PWA (/staff/*)

     UI optimizada para tablet, gestos grandes:

     - Pantalla mesas: grid visual zonas → mesas, color status (libre/ocupada/reserva próxima). Tap mesa abre flow.
     - Take order flow (/staff/{rest}/{branch}/order/new?table={id}):
       a. Header: mesa N, capacidad, zona
       b. Buscador grande + tabs categorías (mismas categorías del storefront, filtradas por branch_products.available)
       c. Tap producto → modal modificadores + cantidad (reusar ProductModal con prop compactMode)
       d. Sidebar/bottom sheet: items cargados, subtotal
       e. Step datos: nombre (required), teléfono, "¿factura?" toggle → RUC + razón social (HeroUI Input)
       f. Confirmar → createOrder con source='waiter', waiter_id, branch_id, datos billing
       g. Pantalla éxito: muestra QR del tracker /{rest}/{branch}/order/{id} para que cliente escanee y siga estado

     Reusar Zustand cart store con instancia separada (useStaffCartStore).

     Carga modal de productos por categoría con paginación virtual si menú grande.

     ---
     Fase 5 — Reservas

     Storefront (/{rest}/{branch}/reservas):
     - Form HeroUI: nombre, teléfono, email opcional, party_size, fecha+hora (DatePicker), zona preferida (Select
     opcional), notas
     - Submit → createReservation server action → insert con status=pending
     - Pantalla confirmación: "Recibimos tu solicitud. Te confirmamos por WhatsApp/email en breve."

     Admin (/admin/{rest}/{branch}/reservations):
     - Vista Kanban (pending / confirmed / seated / completed)
     - Vista calendario opcional (defer, no MVP)
     - Click reservation → modal con detalles, botón "Asignar mesa" (dropdown filtrado por capacidad ≥ party_size y
     disponibilidad en franja), "Confirmar" / "Rechazar"
     - Notif realtime: subscribir tabla reservations para new pending

     Validación overlap: al asignar mesa, query reservations mismo table_id en ventana [reservation_at, reservation_at +
      duration_minutes]. Conflict → bloquear.

     ---
     Fase 6 — Limpieza, RLS audit, seed

     - Actualizar seed.sql para crear branch "Principal" + zonas (Salón) + staff superadmin + tables con capacity por
     restaurante demo
     - Audit RLS con mcp__supabase__get_advisors (security lints)
     - Actualizar ROADMAP.md reflejando fases
     - Tipos TS regenerar (mcp__supabase__generate_typescript_types) → guardar en lib/types/database.ts

     ---
     Herramientas obligatorias

     - Supabase MCP: usar mcp__claude_ai_Supabase__list_tables antes de migration, apply_migration para aplicar,
     get_advisors post-cambio (security lints), generate_typescript_types para regenerar lib/types/database.ts,
     execute_sql para queries ad-hoc de verificación, get_logs si debug runtime.
     - HeroUI MCP: antes de cualquier UI nueva o componente nuevo: mcp__heroui-react__list_components +
     get_component_docs para confirmar API v3 (compound pattern, no Provider). Componentes a usar: Button,
     TextField+Input+Label, Select, Modal, Card, Avatar, Chip, Tabs, Dropdown, DatePicker, NumberField, Separator,
     Switch, Toast, Spinner. Si falta un primitive, copiar source con get_component_source_code a app/components/ui/.
     - Regla de AGENTS.md: HeroUI first, hardcode último recurso.

     Archivos críticos

     Modificar:
     - lib/current-restaurant.ts — agregar getCurrentBranch, getCurrentStaffRole
     - components/admin/Sidebar.tsx — BranchSwitcher + secciones por rol
     - app/(admin)/admin/[restaurantSlug]/* — mover/anidar bajo [branchSlug]
     - app/(storefront)/[slug]/page.tsx — branch resolver + redirect default
     - app/auth/login/page.tsx, app/auth/register/page.tsx — apuntar a /auth/post-login
     - lib/actions/restaurant.ts (existing menu/tables actions) — scope a branch
     - lib/stores/cart.ts — duplicar como staff-cart.ts o factory pattern

     Crear:
     - supabase/migrations/0001_branches_staff_reservations.sql
     - app/auth/post-login/route.ts
     - app/(admin)/admin/[restaurantSlug]/[branchSlug]/**
     - app/(admin)/admin/[restaurantSlug]/sucursales/**
     - app/(admin)/admin/[restaurantSlug]/settings/staff/page.tsx
     - app/(storefront)/[slug]/[branchSlug]/**
     - app/(staff)/staff/[restaurantSlug]/[branchSlug]/**
     - components/admin/BranchSwitcher.tsx, BranchesManager.tsx, StaffManager.tsx, ZonesManager.tsx,
     MenuOverridesManager.tsx
     - components/staff/* (TableGrid, OrderTaker, ProductPickerFast)
     - lib/actions/branches.ts, staff.ts, zones.ts, branch-products.ts, reservations.ts

     Reutilizar:
     - lib/supabase/server.ts, lib/supabase/client.ts
     - lib/actions/restaurant.ts patrón (slugify, ownership check)
     - KanbanBoard para reservations (mismo drag/status pattern que orders)
     - ProductModal para mozo (con flag compact)
     - HeroUI components: TextField, Input, Button, Select, DatePicker (verificar v3), Modal, Card, Avatar, Chip

     ---
     Verificación end-to-end

     1. Migration: aplicar via mcp__claude_ai_Supabase__apply_migration. Verificar con list_tables + execute_sql (select
      count(*) from branches; select count(*) from tables where branch_id is null;) que branches creadas por restaurante
      existente y tables/orders backfilled.
     2. Onboarding flow: registrar usuario nuevo → crear restaurante → crear sucursal "Principal" → crear zonas (Salón,
     Terraza) → crear mesas (con capacity 4, asignadas a zonas) → crear staff (1 admin, 1 waiter).
     3. Storefront: visitar /{rest}/{branch} (default redirect), QR mesa 1 → hacer pedido → confirmar tracker funcional.
     4. Mozo flow: login con cuenta waiter → redirige a /staff/{rest}/{branch} → ver mesas → tomar pedido en Mesa 2 →
     confirmar → verificar order con source=waiter, waiter_id set.
     5. Reservas: cliente desde /{rest}/{branch}/reservas solicita 4 personas mañana 21:00 → admin ve pending → asigna
     Mesa 6, confirma → email/whatsapp (mock) → cliente recibe confirmación.
     6. Multi-branch: crear segunda sucursal "Centro" → menú override: deshabilitar producto X solo en Centro →
     verificar storefront Centro no muestra X.
     7. RLS audit: mcp__claude_ai_Supabase__get_advisors sin issues nuevos. Probar que staff de branch A no ve orders de
      branch B.
     8. TypeScript: npx tsc --noEmit limpio.
     9. Build: npm run build sin errores.