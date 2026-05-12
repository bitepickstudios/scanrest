-- ScanRest demo seed
-- Run in Supabase SQL editor as service_role (bypasses RLS).
-- Requires: an auth.users row to use as owner_id. Edit OWNER_ID below.
--
-- Usage:
--   1. Create auth user via /auth/register (o Supabase dashboard).
--   2. Get user id: SELECT id FROM auth.users WHERE email = 'tu@email.com';
--   3. Replace 'OWNER_ID_HERE' below with that uuid.
--   4. Run this file.
--
-- Multi-restaurant: este seed crea 4 restaurantes bajo el MISMO owner_id.
-- Al loguearte verás el selector /auth/select-restaurant para elegir entre
-- Burger House, Sakura Sushi, Bella Pizza, Aroma Café (+ los que ya tenías).

DO $$
DECLARE
  owner uuid := 'OWNER_ID_HERE';

  r_burger uuid := gen_random_uuid();
  r_sushi  uuid := gen_random_uuid();
  r_pizza  uuid := gen_random_uuid();
  r_cafe   uuid := gen_random_uuid();

  c_burgers uuid; c_sides uuid; c_drinks_b uuid;
  c_rolls uuid; c_nigiri uuid; c_drinks_s uuid;
  c_pizzas uuid; c_pastas uuid; c_drinks_p uuid;
  c_coffee uuid; c_pastries uuid; c_brunch uuid;

  p_classic uuid; p_doble uuid; p_veggie uuid;
  p_california uuid; p_philly uuid;
  p_margarita uuid; p_pepperoni uuid;
  p_latte uuid; p_croissant uuid;

  g_punto uuid; g_extras uuid;
  g_size uuid;
BEGIN

  -- Wipe existing demo data (idempotent re-runs)
  DELETE FROM restaurants WHERE slug IN ('burger-house','sakura-sushi','bella-pizza','aroma-cafe');

  -- ============ 1. BURGER HOUSE (table mode) ============
  INSERT INTO restaurants (id, owner_id, name, slug, description, phone, whatsapp, instagram, address, mode, active)
  VALUES (r_burger, owner, 'Burger House', 'burger-house',
          'Hamburguesas artesanales y papas crocantes. Pedí desde tu mesa.',
          '+595981111111', '+595981111111', 'burgerhouse.py',
          'Av. Mariscal López 1234, Asunción', 'table', true);

  INSERT INTO tables (restaurant_id, number, label, active)
  SELECT r_burger, n, 'Mesa ' || n, true FROM generate_series(1, 8) n;

  INSERT INTO categories (restaurant_id, name, sort_order) VALUES
    (r_burger, 'Burgers', 1) RETURNING id INTO c_burgers;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES
    (r_burger, 'Acompañamientos', 2) RETURNING id INTO c_sides;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES
    (r_burger, 'Bebidas', 3) RETURNING id INTO c_drinks_b;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_burger, c_burgers, 'Classic House', 'Medallón 150g, cheddar, lechuga, tomate, salsa de la casa.', 45000, true, 1)
  RETURNING id INTO p_classic;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_burger, c_burgers, 'Doble Bacon', 'Doble medallón, bacon crocante, cheddar doble, cebolla caramelizada.', 65000, true, 2)
  RETURNING id INTO p_doble;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_burger, c_burgers, 'Veggie Crunch', 'Medallón de garbanzo, palta, rúcula, mayo de ajo.', 42000, true, 3)
  RETURNING id INTO p_veggie;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order) VALUES
    (r_burger, c_sides, 'Papas clásicas', 'Porción individual con sal marina.', 18000, true, 1),
    (r_burger, c_sides, 'Papas cheddar y bacon', 'Bañadas en cheddar fundido y bacon.', 28000, true, 2),
    (r_burger, c_sides, 'Aros de cebolla', 'Crocantes, con salsa BBQ.', 22000, true, 3),
    (r_burger, c_drinks_b, 'Coca Cola 500ml', NULL, 12000, true, 1),
    (r_burger, c_drinks_b, 'Limonada de menta', NULL, 18000, true, 2),
    (r_burger, c_drinks_b, 'Cerveza Pilsen', NULL, 20000, true, 3);

  -- Modifiers for Classic House: punto de cocción (required) + extras (opcional)
  INSERT INTO modifier_groups (product_id, name, required, max_selections)
  VALUES (p_classic, 'Punto de cocción', true, 1) RETURNING id INTO g_punto;
  INSERT INTO modifiers (group_id, name, price_delta) VALUES
    (g_punto, 'Jugosa', 0),
    (g_punto, 'A punto', 0),
    (g_punto, 'Bien cocida', 0);

  INSERT INTO modifier_groups (product_id, name, required, max_selections)
  VALUES (p_classic, 'Extras', false, 3) RETURNING id INTO g_extras;
  INSERT INTO modifiers (group_id, name, price_delta) VALUES
    (g_extras, 'Bacon extra', 8000),
    (g_extras, 'Queso extra', 5000),
    (g_extras, 'Huevo frito', 5000),
    (g_extras, 'Palta', 7000);

  -- Doble Bacon: misma estructura
  INSERT INTO modifier_groups (product_id, name, required, max_selections)
  VALUES (p_doble, 'Punto de cocción', true, 1) RETURNING id INTO g_punto;
  INSERT INTO modifiers (group_id, name, price_delta) VALUES
    (g_punto, 'Jugosa', 0), (g_punto, 'A punto', 0), (g_punto, 'Bien cocida', 0);

  -- ============ 2. SAKURA SUSHI (table mode) ============
  INSERT INTO restaurants (id, owner_id, name, slug, description, phone, whatsapp, instagram, address, mode, active)
  VALUES (r_sushi, owner, 'Sakura Sushi', 'sakura-sushi',
          'Sushi fresco hecho al momento. Rolls clásicos y de autor.',
          '+595982222222', '+595982222222', 'sakura.py',
          'Av. España 567, Asunción', 'table', true);

  INSERT INTO tables (restaurant_id, number, label, active)
  SELECT r_sushi, n, 'Mesa ' || n, true FROM generate_series(1, 6) n;

  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_sushi, 'Rolls', 1) RETURNING id INTO c_rolls;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_sushi, 'Nigiri', 2) RETURNING id INTO c_nigiri;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_sushi, 'Bebidas', 3) RETURNING id INTO c_drinks_s;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_sushi, c_rolls, 'California Roll', '8 piezas. Kanikama, palta, pepino, sésamo.', 55000, true, 1)
  RETURNING id INTO p_california;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_sushi, c_rolls, 'Philadelphia', '8 piezas. Salmón, queso crema, palta.', 68000, true, 2)
  RETURNING id INTO p_philly;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order) VALUES
    (r_sushi, c_rolls, 'Spicy Tuna', '8 piezas. Atún picante, cebollín.', 72000, true, 3),
    (r_sushi, c_nigiri, 'Nigiri salmón', '2 piezas.', 28000, true, 1),
    (r_sushi, c_nigiri, 'Nigiri atún', '2 piezas.', 30000, true, 2),
    (r_sushi, c_drinks_s, 'Té verde', NULL, 14000, true, 1),
    (r_sushi, c_drinks_s, 'Sake caliente', NULL, 32000, true, 2);

  -- ============ 3. BELLA PIZZA (foodcourt mode) ============
  INSERT INTO restaurants (id, owner_id, name, slug, description, phone, whatsapp, instagram, address, mode, active)
  VALUES (r_pizza, owner, 'Bella Pizza', 'bella-pizza',
          'Pizza al horno de leña. Retirá tu pedido en mostrador.',
          '+595983333333', '+595983333333', 'bellapizza.py',
          'Patio gastronómico Shopping del Sol', 'foodcourt', true);

  INSERT INTO tables (restaurant_id, number, label, active) VALUES (r_pizza, 1, 'Mostrador', true);

  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_pizza, 'Pizzas', 1) RETURNING id INTO c_pizzas;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_pizza, 'Pastas', 2) RETURNING id INTO c_pastas;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_pizza, 'Bebidas', 3) RETURNING id INTO c_drinks_p;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_pizza, c_pizzas, 'Margarita', 'Mozzarella, tomate fresco, albahaca, aceite de oliva.', 55000, true, 1)
  RETURNING id INTO p_margarita;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_pizza, c_pizzas, 'Pepperoni', 'Mozzarella, pepperoni, orégano.', 65000, true, 2)
  RETURNING id INTO p_pepperoni;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order) VALUES
    (r_pizza, c_pizzas, 'Cuatro Quesos', 'Mozzarella, parmesano, gorgonzola, provolone.', 75000, true, 3),
    (r_pizza, c_pastas, 'Spaghetti Bolognesa', 'Salsa de carne casera.', 48000, true, 1),
    (r_pizza, c_pastas, 'Fettuccine Alfredo', 'Crema, parmesano, pimienta negra.', 52000, true, 2),
    (r_pizza, c_drinks_p, 'Vino tinto copa', NULL, 25000, true, 1),
    (r_pizza, c_drinks_p, 'Agua mineral', NULL, 8000, true, 2);

  -- Pizza size modifier
  INSERT INTO modifier_groups (product_id, name, required, max_selections)
  VALUES (p_margarita, 'Tamaño', true, 1) RETURNING id INTO g_size;
  INSERT INTO modifiers (group_id, name, price_delta) VALUES
    (g_size, 'Personal', 0),
    (g_size, 'Mediana', 15000),
    (g_size, 'Grande', 30000);

  INSERT INTO modifier_groups (product_id, name, required, max_selections)
  VALUES (p_pepperoni, 'Tamaño', true, 1) RETURNING id INTO g_size;
  INSERT INTO modifiers (group_id, name, price_delta) VALUES
    (g_size, 'Personal', 0), (g_size, 'Mediana', 15000), (g_size, 'Grande', 30000);

  -- ============ 4. AROMA CAFÉ (foodcourt mode) ============
  INSERT INTO restaurants (id, owner_id, name, slug, description, phone, whatsapp, instagram, address, mode, active)
  VALUES (r_cafe, owner, 'Aroma Café', 'aroma-cafe',
          'Café de especialidad y pastelería casera.',
          '+595984444444', '+595984444444', 'aromacafe.py',
          'Av. Brasilia 890, Asunción', 'foodcourt', true);

  INSERT INTO tables (restaurant_id, number, label, active) VALUES (r_cafe, 1, 'Mostrador', true);

  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_cafe, 'Café', 1) RETURNING id INTO c_coffee;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_cafe, 'Pastelería', 2) RETURNING id INTO c_pastries;
  INSERT INTO categories (restaurant_id, name, sort_order) VALUES (r_cafe, 'Brunch', 3) RETURNING id INTO c_brunch;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order)
  VALUES (r_cafe, c_coffee, 'Latte', 'Espresso doble con leche vaporizada.', 22000, true, 1)
  RETURNING id INTO p_latte;

  INSERT INTO products (restaurant_id, category_id, name, description, price, available, sort_order) VALUES
    (r_cafe, c_coffee, 'Espresso', 'Doble shot.', 15000, true, 2),
    (r_cafe, c_coffee, 'Cappuccino', 'Espresso, leche, espuma cremosa.', 22000, true, 3),
    (r_cafe, c_coffee, 'Cold Brew', 'Infusionado 18 horas.', 25000, true, 4),
    (r_cafe, c_pastries, 'Croissant', 'Manteca pura.', 12000, true, 1),
    (r_cafe, c_pastries, 'Cheesecake frutos rojos', NULL, 28000, true, 2),
    (r_cafe, c_brunch, 'Avocado Toast', 'Pan de campo, palta, huevo poché.', 35000, true, 1),
    (r_cafe, c_brunch, 'Bowl de açaí', 'Granola, banana, frutos rojos, miel.', 38000, true, 2);

  -- Latte: tipo de leche
  INSERT INTO modifier_groups (product_id, name, required, max_selections)
  VALUES (p_latte, 'Tipo de leche', true, 1) RETURNING id INTO g_size;
  INSERT INTO modifiers (group_id, name, price_delta) VALUES
    (g_size, 'Entera', 0),
    (g_size, 'Descremada', 0),
    (g_size, 'Almendras', 5000),
    (g_size, 'Avena', 5000);

  -- ============ Reviews ============
  INSERT INTO reviews (restaurant_id, customer_name, rating, comment) VALUES
    (r_burger, 'Carlos M.', 5, 'La doble bacon es brutal. Mejor burger de Asunción.'),
    (r_burger, 'Ana P.', 4, 'Muy buena, las papas cheddar imperdibles.'),
    (r_burger, 'Diego R.', 5, 'Atención rapidísima escaneando el QR.'),
    (r_burger, 'Lucía F.', 4, 'Rica, aunque tardó un poco más de lo esperado.'),
    (r_sushi, 'María G.', 5, 'El philadelphia roll es perfecto. Volveré.'),
    (r_sushi, 'Pedro L.', 5, 'Sushi muy fresco, recomendado 100%.'),
    (r_sushi, 'Sofía V.', 4, 'Buen sushi, el local es chico pero acogedor.'),
    (r_pizza, 'Roberto C.', 5, 'La masa de leña hace toda la diferencia.'),
    (r_pizza, 'Camila S.', 4, 'Buenísima la cuatro quesos. Volvería.'),
    (r_pizza, 'Javier N.', 5, 'Pedí desde el celu y me avisaron cuando estaba lista. Top.'),
    (r_cafe, 'Valentina B.', 5, 'El cold brew es adictivo y el avocado toast un golazo.'),
    (r_cafe, 'Martín D.', 5, 'Mejor café de la zona. Servicio impecable.'),
    (r_cafe, 'Florencia A.', 4, 'Lindo lugar para desayunar.');

END $$;

SELECT slug, name, mode FROM restaurants WHERE slug IN ('burger-house','sakura-sushi','bella-pizza','aroma-cafe');
