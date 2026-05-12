-- Add tiktok handle to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tiktok TEXT;
