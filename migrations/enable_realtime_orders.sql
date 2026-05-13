-- Enable Realtime on orders so storefront tracker + admin Kanban receive
-- live status updates without polling.

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_item_modifiers;

-- Realtime delivers UPDATE diffs only when REPLICA IDENTITY contains
-- enough columns. DEFAULT covers PK which is enough for our use
-- (subscribers re-fetch row by id). No change needed.
