-- STEP 3: DATA TRANSFER VIA FOREIGN DATA WRAPPER
-- Connects the old database and pulls data directly into the new database tables.

-- WARNING: YOU MUST REPLACE THESE VALUES WITH THE OLD PROD DB CREDENTIALS
-- Old DB Host: aws-0-ap-south-1.pooler.supabase.com (or similar)
-- Old DB Port: 6543 (transaction) or 5432 (session)
-- Old DB Name: postgres
-- Old DB User: postgres.imlbvvxyxlknevvlbbpr
-- Old DB Pass: YOUR_OLD_DB_PASSWORD

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 1. Create the server connection (Replace with actual OLD DB Host/Port/Name)
CREATE SERVER IF NOT EXISTS old_prod_db
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'aws-0-ap-south-1.pooler.supabase.com', port '6543', dbname 'postgres');

-- 2. Map the current user (postgres) to the remote user
-- REPLACE 'YOUR_OLD_DB_PASSWORD' below with the actual old project pg password
CREATE USER MAPPING IF NOT EXISTS FOR postgres
  SERVER old_prod_db
  OPTIONS (user 'postgres.imlbvvxyxlknevvlbbpr', password 'YOUR_OLD_DB_PASSWORD');

-- 3. Create a schema for the foreign tables to reside in
CREATE SCHEMA IF NOT EXISTS old_public;

-- 4. Import the foreign schema
IMPORT FOREIGN SCHEMA public
  FROM SERVER old_prod_db
  INTO old_public;

-- 5. Disable Triggers to avoid firing side effects (like updated_at or email sending) during import
SET session_replication_role = 'replica';

-- 6. Insert data for all tables in topological order

-- Transfer profiles
INSERT INTO public.profiles
SELECT * FROM old_public.profiles
ON CONFLICT DO NOTHING;

-- Transfer user_roles
INSERT INTO public.user_roles
SELECT * FROM old_public.user_roles
ON CONFLICT DO NOTHING;

-- Transfer seasons
INSERT INTO public.seasons
SELECT * FROM old_public.seasons
ON CONFLICT DO NOTHING;

-- Transfer room_categories
INSERT INTO public.room_categories
SELECT * FROM old_public.room_categories
ON CONFLICT DO NOTHING;

-- Transfer meal_plan_prices
INSERT INTO public.meal_plan_prices
SELECT * FROM old_public.meal_plan_prices
ON CONFLICT DO NOTHING;

-- Transfer packages
INSERT INTO public.packages
SELECT * FROM old_public.packages
ON CONFLICT DO NOTHING;

-- Transfer rooms
INSERT INTO public.rooms
SELECT * FROM old_public.rooms
ON CONFLICT DO NOTHING;

-- Transfer bookings
INSERT INTO public.bookings
SELECT * FROM old_public.bookings
ON CONFLICT DO NOTHING;

-- Transfer blocked_dates
INSERT INTO public.blocked_dates
SELECT * FROM old_public.blocked_dates
ON CONFLICT DO NOTHING;

-- Transfer tax_config
INSERT INTO public.tax_config
SELECT * FROM old_public.tax_config
ON CONFLICT DO NOTHING;

-- Transfer enquiries
INSERT INTO public.enquiries
SELECT * FROM old_public.enquiries
ON CONFLICT DO NOTHING;

-- Transfer gallery_images
INSERT INTO public.gallery_images
SELECT * FROM old_public.gallery_images
ON CONFLICT DO NOTHING;

-- Transfer experiences
INSERT INTO public.experiences
SELECT * FROM old_public.experiences
ON CONFLICT DO NOTHING;

-- Transfer reviews
INSERT INTO public.reviews
SELECT * FROM old_public.reviews
ON CONFLICT DO NOTHING;

-- Transfer channel_manager_logs
INSERT INTO public.channel_manager_logs
SELECT * FROM old_public.channel_manager_logs
ON CONFLICT DO NOTHING;

-- Transfer resort_settings
INSERT INTO public.resort_settings
SELECT * FROM old_public.resort_settings
ON CONFLICT DO NOTHING;

-- Transfer payment_settings
INSERT INTO public.payment_settings
SELECT * FROM old_public.payment_settings
ON CONFLICT DO NOTHING;

-- Transfer channel_manager_settings
INSERT INTO public.channel_manager_settings
SELECT * FROM old_public.channel_manager_settings
ON CONFLICT DO NOTHING;

-- Transfer blogs
INSERT INTO public.blogs
SELECT * FROM old_public.blogs
ON CONFLICT DO NOTHING;

-- Transfer chat_leads
INSERT INTO public.chat_leads
SELECT * FROM old_public.chat_leads
ON CONFLICT DO NOTHING;

-- Transfer chat_sessions
INSERT INTO public.chat_sessions
SELECT * FROM old_public.chat_sessions
ON CONFLICT DO NOTHING;

-- Transfer knowledge_base
INSERT INTO public.knowledge_base
SELECT * FROM old_public.knowledge_base
ON CONFLICT DO NOTHING;

-- 7. Re-enable Triggers
SET session_replication_role = 'origin';

-- 8. Clean up Foreign Data Wrapper
DROP SCHEMA IF EXISTS old_public CASCADE;
DROP USER MAPPING IF EXISTS FOR postgres SERVER old_prod_db;
DROP SERVER IF EXISTS old_prod_db CASCADE;

-- DATA TRANSFER COMPLETE!
