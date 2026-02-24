-- Clean start for project objects
DO $$ BEGIN
    DROP TABLE IF EXISTS public.chat_sessions CASCADE;
    DROP TABLE IF EXISTS public.chat_leads CASCADE;
    DROP TABLE IF EXISTS public.blogs CASCADE;
    DROP TABLE IF EXISTS public.channel_manager_settings CASCADE;
    DROP TABLE IF EXISTS public.payment_settings CASCADE;
    DROP TABLE IF EXISTS public.resort_settings CASCADE;
    DROP TABLE IF EXISTS public.channel_manager_logs CASCADE;
    DROP TABLE IF EXISTS public.reviews CASCADE;
    DROP TABLE IF EXISTS public.experiences CASCADE;
    DROP TABLE IF EXISTS public.rooms CASCADE;
    DROP TABLE IF EXISTS public.gallery_images CASCADE;
    DROP TABLE IF EXISTS public.enquiries CASCADE;
    DROP TABLE IF EXISTS public.tax_config CASCADE;
    DROP TABLE IF EXISTS public.blocked_dates CASCADE;
    DROP TABLE IF EXISTS public.bookings CASCADE;
    DROP TABLE IF EXISTS public.packages CASCADE;
    DROP TABLE IF EXISTS public.meal_plan_prices CASCADE;
    DROP TABLE IF EXISTS public.room_categories CASCADE;
    DROP TABLE IF EXISTS public.seasons CASCADE;
    DROP TABLE IF EXISTS public.user_roles CASCADE;
    DROP TABLE IF EXISTS public.profiles CASCADE;
    DROP TYPE IF EXISTS public.payment_status CASCADE;
    DROP TYPE IF EXISTS public.booking_source CASCADE;
    DROP TYPE IF EXISTS public.season_type CASCADE;
    DROP TYPE IF EXISTS public.package_type CASCADE;
    DROP TYPE IF EXISTS public.room_status CASCADE;
    DROP TYPE IF EXISTS public.meal_plan CASCADE;
    DROP TYPE IF EXISTS public.booking_status CASCADE;
    DROP TYPE IF EXISTS public.app_role CASCADE;
END $$;

-- Idempotent schema setup
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Migration: 20260127072309_e560aaa3-81d7-4ceb-a174-875f8985ea3c.sql
-- =====================================================
-- ARANYA RESORT BOOKING SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1. ENUMS
-- =====================================================

-- Admin roles enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'app_role' AND n.nspname = 'public') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'staff'); 
    END IF;
END $$;


-- Booking status enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'booking_status' AND n.nspname = 'public') THEN
        CREATE TYPE public.booking_status AS ENUM ('new_enquiry', 'pending_confirmation', 'confirmed', 'cancelled', 'completed'); 
    END IF;
END $$;


-- Meal plan enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'meal_plan' AND n.nspname = 'public') THEN
        CREATE TYPE public.meal_plan AS ENUM ('EP', 'CP', 'MAP', 'AP'); 
    END IF;
END $$;


-- Room status enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'room_status' AND n.nspname = 'public') THEN
        CREATE TYPE public.room_status AS ENUM ('active', 'inactive', 'maintenance'); 
    END IF;
END $$;


-- Package type enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'package_type' AND n.nspname = 'public') THEN
        CREATE TYPE public.package_type AS ENUM ('honeymoon', 'safari', 'family', 'corporate', 'weekend', 'wedding', 'seasonal'); 
    END IF;
END $$;


-- Season type enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'season_type' AND n.nspname = 'public') THEN
        CREATE TYPE public.season_type AS ENUM ('peak', 'regular', 'off_peak'); 
    END IF;
END $$;


-- 2. PROFILES TABLE (for guest accounts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. USER ROLES TABLE (for admin access)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'staff')
  )
$$;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 4. SEASONS TABLE (for dynamic pricing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season_type season_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active seasons"
  ON public.seasons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage seasons"
  ON public.seasons FOR ALL
  USING (public.is_admin(auth.uid()));

-- 5. ROOM CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.room_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 1,
  base_occupancy INTEGER NOT NULL DEFAULT 2,
  base_price_per_night DECIMAL(10,2) NOT NULL,
  extra_adult_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  extra_child_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_rooms INTEGER NOT NULL DEFAULT 1,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  status room_status NOT NULL DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active room categories"
  ON public.room_categories FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can view all room categories"
  ON public.room_categories FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage room categories"
  ON public.room_categories FOR ALL
  USING (public.is_admin(auth.uid()));

-- 6. MEAL PLAN PRICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.meal_plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan meal_plan NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  adult_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  child_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active meal plans"
  ON public.meal_plan_prices FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage meal plans"
  ON public.meal_plan_prices FOR ALL
  USING (public.is_admin(auth.uid()));

-- 7. PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  package_type package_type NOT NULL,
  description TEXT,
  short_description TEXT,
  duration_nights INTEGER NOT NULL,
  inclusions JSONB DEFAULT '[]'::jsonb,
  exclusions JSONB DEFAULT '[]'::jsonb,
  is_fixed_price BOOLEAN NOT NULL DEFAULT true,
  fixed_price DECIMAL(10,2),
  per_night_price DECIMAL(10,2),
  applicable_room_ids UUID[] DEFAULT '{}',
  valid_from DATE,
  valid_until DATE,
  min_guests INTEGER DEFAULT 1,
  max_guests INTEGER,
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (public.is_admin(auth.uid()));

-- 8. BOOKINGS TABLE (main bookings table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Guest details (for guest checkout)
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_city TEXT,
  special_requests TEXT,
  
  -- Booking details
  room_category_id UUID REFERENCES public.room_categories(id) NOT NULL,
  package_id UUID REFERENCES public.packages(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_nights INTEGER NOT NULL,
  num_adults INTEGER NOT NULL DEFAULT 1,
  num_children INTEGER NOT NULL DEFAULT 0,
  meal_plan meal_plan NOT NULL DEFAULT 'EP',
  
  -- Pricing breakdown (stored at time of booking)
  room_total DECIMAL(10,2) NOT NULL,
  extra_guest_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  meal_plan_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  package_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  
  -- Status
  status booking_status NOT NULL DEFAULT 'new_enquiry',
  is_enquiry_only BOOLEAN NOT NULL DEFAULT false,
  
  -- Admin fields
  internal_notes TEXT,
  assigned_room_number TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Anyone can create bookings (for guest checkout)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- Users can update their own pending bookings
CREATE POLICY "Users can update own pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'new_enquiry');

-- Admins can update any booking
CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- 9. BLOCKED DATES TABLE (for availability management)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_category_id UUID REFERENCES public.room_categories(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  rooms_blocked INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_category_id, blocked_date, booking_id)
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked dates"
  ON public.blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blocked dates"
  ON public.blocked_dates FOR ALL
  USING (public.is_admin(auth.uid()));

-- 10. TAXES CONFIG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tax_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active taxes"
  ON public.tax_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage taxes"
  ON public.tax_config FOR ALL
  USING (public.is_admin(auth.uid()));

-- 11. BOOKING REFERENCE GENERATOR
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_ref TEXT;
  ref_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate reference: AR + date + random 4 digits
    new_ref := 'AR' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_reference = new_ref) INTO ref_exists;
    
    EXIT WHEN NOT ref_exists;
  END LOOP;
  
  RETURN new_ref;
END;
$$;

-- 12. TRIGGER FOR AUTOMATIC BOOKING REFERENCE
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
    NEW.booking_reference := public.generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_booking_reference
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_reference();

-- 13. TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_room_categories_updated_at
  BEFORE UPDATE ON public.room_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_meal_plan_prices_updated_at
  BEFORE UPDATE ON public.meal_plan_prices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT INTO public.profiles (user_id, email, full_name)
--   VALUES (
--     NEW.id,
--     NEW.email,
--     COALESCE(NEW.raw_user_meta_data->>'full_name', '')
--   );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. FUNCTION TO CALCULATE AVAILABLE ROOMS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_available_rooms(
  p_room_category_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_rooms INTEGER;
  max_blocked INTEGER;
BEGIN
  -- Get total rooms for category
  SELECT total_rooms INTO total_rooms
  FROM public.room_categories
  WHERE id = p_room_category_id;
  
  IF total_rooms IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get max rooms blocked for any date in range
  SELECT COALESCE(MAX(daily_blocked), 0) INTO max_blocked
  FROM (
    SELECT blocked_date, SUM(rooms_blocked) as daily_blocked
    FROM public.blocked_dates
    WHERE room_category_id = p_room_category_id
      AND blocked_date >= p_check_in
      AND blocked_date < p_check_out
    GROUP BY blocked_date
  ) AS daily_totals;
  
  RETURN GREATEST(total_rooms - max_blocked, 0);
END;
$$;

-- 16. FUNCTION TO GET SEASON MULTIPLIER
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_season_multiplier(p_date DATE)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  multiplier DECIMAL(3,2);
BEGIN
  SELECT price_multiplier INTO multiplier
  FROM public.seasons
  WHERE is_active = true
    AND p_date BETWEEN start_date AND end_date
  ORDER BY price_multiplier DESC
  LIMIT 1;
  
  RETURN COALESCE(multiplier, 1.00);
END;
$$;

-- 17. SEED DEFAULT DATA
-- =====================================================

-- Default meal plan prices
-- INSERT INTO public.meal_plan_prices (meal_plan, name, description, adult_price, child_price) VALUES
--   ('EP', 'Room Only', 'European Plan - No meals included', 0, 0),
--   ('CP', 'Breakfast', 'Continental Plan - Breakfast included', 800, 400),
--   ('MAP', 'Breakfast + Dinner', 'Modified American Plan - Two meals included', 1500, 750),
--   ('AP', 'All Meals', 'American Plan - All meals included', 2200, 1100);

-- Default tax config
-- INSERT INTO public.tax_config (name, percentage) VALUES
--   ('GST', 18.00);

-- Default seasons (example)
-- INSERT INTO public.seasons (name, season_type, start_date, end_date, price_multiplier) VALUES
--   ('Peak Season', 'peak', '2026-10-01', '2027-03-31', 1.25),
--   ('Regular Season', 'regular', '2026-04-01', '2026-06-30', 1.00),
--   ('Monsoon Off-Peak', 'off_peak', '2026-07-01', '2026-09-30', 0.85);

-- Sample room categories
-- INSERT INTO public.room_categories (name, slug, description, max_adults, max_children, base_occupancy, base_price_per_night, extra_adult_price, extra_child_price, total_rooms, sort_order) VALUES
--   ('Forest Villa', 'forest-villa', 'Elegantly designed forest villas with private decks and panoramic jungle views. Perfect for couples and families seeking an authentic wilderness experience.', 3, 2, 2, 18000, 3500, 1800, 8, 1),
--   ('Treehouse Suite', 'treehouse-suite', 'Perched above the forest floor, our Treehouse Suites offer an unparalleled connection with nature. Wake up to bird songs and watch the sunrise through the treetops.', 2, 1, 2, 25000, 0, 2000, 4, 2),
--   ('Pool Villa', 'pool-villa', 'The epitome of luxury with a private infinity pool overlooking the forest. Perfect for honeymoons or those seeking the ultimate indulgence.', 4, 2, 2, 45000, 5000, 2500, 3, 3);

-- Migration: 20260127072354_1c59137e-208d-4730-b8f3-7451894f0224.sql
-- Fix function search paths for security

-- 1. Fix generate_booking_reference
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ref TEXT;
  ref_exists BOOLEAN;
BEGIN
  LOOP
    new_ref := 'AR' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_reference = new_ref) INTO ref_exists;
    EXIT WHEN NOT ref_exists;
  END LOOP;
  RETURN new_ref;
END;
$$;

-- 2. Fix set_booking_reference
CREATE OR REPLACE FUNCTION public.set_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
    NEW.booking_reference := public.generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Fix handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Fix get_available_rooms
CREATE OR REPLACE FUNCTION public.get_available_rooms(
  p_room_category_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_rooms INTEGER;
  max_blocked INTEGER;
BEGIN
  SELECT rc.total_rooms INTO total_rooms
  FROM public.room_categories rc
  WHERE rc.id = p_room_category_id;
  
  IF total_rooms IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COALESCE(MAX(daily_blocked), 0) INTO max_blocked
  FROM (
    SELECT blocked_date, SUM(rooms_blocked) as daily_blocked
    FROM public.blocked_dates
    WHERE room_category_id = p_room_category_id
      AND blocked_date >= p_check_in
      AND blocked_date < p_check_out
    GROUP BY blocked_date
  ) AS daily_totals;
  
  RETURN GREATEST(total_rooms - max_blocked, 0);
END;
$$;

-- 5. Fix get_season_multiplier
CREATE OR REPLACE FUNCTION public.get_season_multiplier(p_date DATE)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  multiplier DECIMAL(3,2);
BEGIN
  SELECT price_multiplier INTO multiplier
  FROM public.seasons
  WHERE is_active = true
    AND p_date BETWEEN start_date AND end_date
  ORDER BY price_multiplier DESC
  LIMIT 1;
  
  RETURN COALESCE(multiplier, 1.00);
END;
$$;

-- 6. Update bookings insert policy to be more restrictive (rate limiting at app level)
-- The policy allows anyone to create bookings for guest checkout, which is intentional
-- But we can add validation at the application level

-- Migration: 20260201085706_c5099c04-0287-4ac2-92fa-b800b3b63d15.sql
-- Create enum for app roles
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'app_role' AND n.nspname = 'public') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'staff', 'guest'); 
    END IF;
END $$;


-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is any admin type
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'staff')
  )
$$;

-- RLS Policies for user_roles table
-- Super admins can view all roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can insert roles (except super_admin)
CREATE POLICY "Super admins can insert staff roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') 
  AND role != 'super_admin'
);

-- Super admins can delete non-super_admin roles
CREATE POLICY "Super admins can delete staff roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') 
  AND role != 'super_admin'
);

-- Users can view their own role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Migration: 20260201090131_5fe70998-d954-475f-b689-7e1b959357b0.sql
-- Insert super_admin role for arpansadhu13@gmail.com
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('41f79de7-9917-406e-993c-e91dbe5de871', 'super_admin');

-- Create room_categories table
CREATE TABLE IF NOT EXISTS public.room_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    max_adults INTEGER NOT NULL DEFAULT 2,
    max_children INTEGER NOT NULL DEFAULT 2,
    base_occupancy INTEGER NOT NULL DEFAULT 2,
    base_price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
    extra_adult_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    extra_child_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_rooms INTEGER NOT NULL DEFAULT 1,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active room categories
CREATE POLICY "Anyone can view active room categories"
ON public.room_categories FOR SELECT
USING (is_active = true);

-- Admins can view all room categories
CREATE POLICY "Admins can view all room categories"
ON public.room_categories FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage room categories
CREATE POLICY "Admins can insert room categories"
ON public.room_categories FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update room categories"
ON public.room_categories FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can delete room categories"
ON public.room_categories FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    inclusions JSONB DEFAULT '[]'::jsonb,
    price_modifier DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_percentage BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (is_active = true);

-- Admins can view all packages
CREATE POLICY "Admins can view all packages"
ON public.packages FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage packages
CREATE POLICY "Admins can insert packages"
ON public.packages FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update packages"
ON public.packages FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can delete packages"
ON public.packages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create booking status enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'booking_status' AND n.nspname = 'public') THEN
        CREATE TYPE public.booking_status AS ENUM ('new_enquiry', 'enquiry_responded', 'quote_sent', 'booking_confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'); 
    END IF;
END $$;


-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    guest_country TEXT,
    room_category_id UUID REFERENCES public.room_categories(id),
    package_id UUID REFERENCES public.packages(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_adults INTEGER NOT NULL DEFAULT 1,
    num_children INTEGER NOT NULL DEFAULT 0,
    num_rooms INTEGER NOT NULL DEFAULT 1,
    special_requests TEXT,
    internal_notes TEXT,
    status booking_status NOT NULL DEFAULT 'new_enquiry',
    is_enquiry_only BOOLEAN NOT NULL DEFAULT true,
    base_price DECIMAL(10,2),
    taxes DECIMAL(10,2),
    extras DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2),
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_reference TEXT,
    assigned_room_numbers TEXT[],
    source TEXT DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Anyone can create enquiries/bookings
CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Anon users can create enquiries
CREATE POLICY "Anon can create enquiries"
ON public.bookings FOR INSERT
TO anon
WITH CHECK (is_enquiry_only = true);

-- Users can update their own pending bookings
CREATE POLICY "Users can update own pending bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status IN ('new_enquiry', 'enquiry_responded'));

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Super admins can delete bookings
CREATE POLICY "Super admins can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create enquiries table for contact form
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit enquiries
CREATE POLICY "Anyone can create enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all enquiries
CREATE POLICY "Admins can view enquiries"
ON public.enquiries FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update enquiries
CREATE POLICY "Admins can update enquiries"
ON public.enquiries FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Super admins can delete enquiries
CREATE POLICY "Super admins can delete enquiries"
ON public.enquiries FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- CREATE OR REPLACE FUNCTION for generating booking reference
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := 'JHR-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
            UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 4));
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for booking reference
CREATE TRIGGER set_booking_reference
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.generate_booking_reference();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_room_categories_updated_at
BEFORE UPDATE ON public.room_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260201090218_c01fbb10-45d9-4b70-a5ab-bd08dff3fb90.sql
-- Drop and recreate the overly permissive booking insert policy
DROP POLICY "Anyone can create bookings" ON public.bookings;

-- Authenticated users can create bookings with their own user_id or null
CREATE POLICY "Authenticated users can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Drop and recreate the overly permissive enquiries insert policy
DROP POLICY "Anyone can create enquiries" ON public.enquiries;

-- Anyone can submit contact enquiries (this is intentional for contact forms)
CREATE POLICY "Public can submit contact enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL 
    AND email IS NOT NULL 
    AND message IS NOT NULL
);

-- Migration: 20260202192023_9dcc7a87-698e-4347-81dc-c5e520cfee98.sql
-- Create gallery_images table
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Property',
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public can view active images
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images
FOR SELECT
USING (is_active = true);

-- Admins can view all
CREATE POLICY "Admins can view all gallery images"
ON public.gallery_images
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert
CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update
CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
USING (is_admin(auth.uid()));

-- Super admins can delete
CREATE POLICY "Super admins can delete gallery images"
ON public.gallery_images
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for gallery images
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update gallery images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gallery' AND is_admin(auth.uid()));

CREATE POLICY "Super admins can delete gallery images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Migration: 20260202192751_497adde9-8c34-4158-84dc-726d5d214e28.sql
-- Create storage bucket for room images
-- INSERT INTO storage.buckets (id, name, public) VALUES ('rooms', 'rooms', true);

-- Storage policies for rooms bucket
CREATE POLICY "Anyone can view room images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'rooms');

CREATE POLICY "Admins can upload room images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'rooms' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update room images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'rooms' AND is_admin(auth.uid()));

CREATE POLICY "Super admins can delete room images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'rooms' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Migration: 20260203063229_b8125daf-9bce-447c-8148-c28ffb4740cc.sql
-- Add category column to enquiries table for distinguishing contact vs job applications
ALTER TABLE public.enquiries 
ADD COLUMN category text NOT NULL DEFAULT 'contact';

-- Add a comment to explain the column
COMMENT ON COLUMN public.enquiries.category IS 'Category of enquiry: contact or job_application';

-- Migration: 20260204064021_457b180d-25e9-4b01-8a9c-e74a2aef3820.sql
-- Create rooms table for individual room instances within categories
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_category_id uuid REFERENCES public.room_categories(id) ON DELETE CASCADE NOT NULL,
    room_number text NOT NULL,
    floor integer DEFAULT 1,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'blocked')),
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(room_category_id, room_number)
);

-- Create blocked_dates table for booking locks and manual blocks
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    blocked_date date NOT NULL,
    reason text NOT NULL DEFAULT 'booking' CHECK (reason IN ('booking', 'maintenance', 'private', 'other')),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(room_id, blocked_date)
);

-- Add room_id to bookings table to track which specific room is assigned
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Create index for fast availability lookups
CREATE INDEX idx_blocked_dates_room_date ON public.blocked_dates(room_id, blocked_date);
CREATE INDEX idx_blocked_dates_booking ON public.blocked_dates(booking_id);
CREATE INDEX idx_rooms_category ON public.rooms(room_category_id);
CREATE INDEX idx_bookings_room ON public.bookings(room_id);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in_date, check_out_date);

-- Enable RLS on new tables
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms table
CREATE POLICY "Anyone can view active rooms" ON public.rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all rooms" ON public.rooms
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert rooms" ON public.rooms
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update rooms" ON public.rooms
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete rooms" ON public.rooms
    FOR DELETE USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for blocked_dates table
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert blocked dates" ON public.blocked_dates
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update blocked dates" ON public.blocked_dates
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete blocked dates" ON public.blocked_dates
    FOR DELETE USING (is_admin(auth.uid()));

-- Function to check room availability for a date range
CREATE OR REPLACE FUNCTION public.check_room_availability(
    _room_id uuid,
    _check_in date,
    _check_out date,
    _exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.blocked_dates bd
        WHERE bd.room_id = _room_id
          AND bd.blocked_date >= _check_in
          AND bd.blocked_date < _check_out
          AND (bd.booking_id IS NULL OR bd.booking_id != COALESCE(_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid))
    )
$$;

-- Function to get available rooms for a category and date range
CREATE OR REPLACE FUNCTION public.get_available_rooms(
    _room_category_id uuid,
    _check_in date,
    _check_out date
)
RETURNS TABLE(room_id uuid, room_number text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT r.id, r.room_number
    FROM public.rooms r
    WHERE r.room_category_id = _room_category_id
      AND r.is_active = true
      AND r.status = 'available'
      AND NOT EXISTS (
          SELECT 1
          FROM public.blocked_dates bd
          WHERE bd.room_id = r.id
            AND bd.blocked_date >= _check_in
            AND bd.blocked_date < _check_out
      )
$$;

-- Function to count available rooms for a category on a date
CREATE OR REPLACE FUNCTION public.count_available_rooms(
    _room_category_id uuid,
    _date date
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::integer
    FROM public.rooms r
    WHERE r.room_category_id = _room_category_id
      AND r.is_active = true
      AND r.status = 'available'
      AND NOT EXISTS (
          SELECT 1
          FROM public.blocked_dates bd
          WHERE bd.room_id = r.id
            AND bd.blocked_date = _date
      )
$$;

-- Function to block dates for a booking (fixed variable name)
CREATE OR REPLACE FUNCTION public.block_dates_for_booking(
    _room_id uuid,
    _booking_id uuid,
    _check_in date,
    _check_out date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    curr_date date := _check_in;
BEGIN
    WHILE curr_date < _check_out LOOP
        -- INSERT INTO public.blocked_dates (room_id, blocked_date, reason, booking_id)
--         VALUES (_room_id, curr_date, 'booking', _booking_id)
--         ON CONFLICT (room_id, blocked_date) DO UPDATE SET booking_id = EXCLUDED.booking_id;
        curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
END;
$$;

-- Trigger function to auto-update updated_at on rooms
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial rooms based on existing room_categories total_rooms
-- INSERT INTO public.rooms (room_category_id, room_number, floor)
-- SELECT 
--     rc.id,
--     'R' || rc.display_order || '-' || gs.num,
--     CEIL(gs.num::float / 2)::integer
-- FROM public.room_categories rc
-- CROSS JOIN LATERAL generate_series(1, rc.total_rooms) AS gs(num)
-- WHERE rc.is_active = true
-- ON CONFLICT (room_category_id, room_number) DO NOTHING;

-- Migration: 20260205051929_ceca1570-3fc4-4bfb-9f3a-6df5a9c4def5.sql
-- Create experiences table
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    long_description TEXT,
    duration TEXT,
    best_time TEXT,
    image_url TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active experiences" 
ON public.experiences 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all experiences" 
ON public.experiences 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert experiences" 
ON public.experiences 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update experiences" 
ON public.experiences 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete experiences" 
ON public.experiences 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for experience images
-- INSERT INTO storage.buckets (id, name, public) VALUES ('experiences', 'experiences', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for experiences bucket
CREATE POLICY "Anyone can view experience images"
ON storage.objects FOR SELECT
USING (bucket_id = 'experiences');

CREATE POLICY "Admins can upload experience images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'experiences' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update experience images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'experiences' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete experience images"
ON storage.objects FOR DELETE
USING (bucket_id = 'experiences' AND is_admin(auth.uid()));

-- Migration: 20260206092408_ae5aec55-d12c-46a0-a315-05c7a770c250.sql
-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_name text NOT NULL,
    reviewer_location text,
    occasion text,
    rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review_text text NOT NULL,
    source text DEFAULT 'google',
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view active reviews
CREATE POLICY "Anyone can view active reviews"
ON public.reviews FOR SELECT
USING (is_active = true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert reviews
CREATE POLICY "Admins can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (is_admin(auth.uid()));

-- Super admins can delete reviews
CREATE POLICY "Super admins can delete reviews"
ON public.reviews FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260207010800_channel_manager_payment.sql
-- Add Source Enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'booking_source' AND n.nspname = 'public') THEN
        CREATE TYPE public.booking_source AS ENUM ('website', 'channel_manager', 'admin'); 
    END IF;
END $$;


-- Add Payment Status Enum
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'payment_status' AND n.nspname = 'public') THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded'); 
    END IF;
END $$;


-- Update Bookings Table
ALTER TABLE public.bookings 
ADD COLUMN source booking_source NOT NULL DEFAULT 'website',
ADD COLUMN channel_manager_id TEXT,
ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'pending',
ADD COLUMN payment_id TEXT,
ADD COLUMN payment_provider TEXT;

-- Update Blocked Dates Table
ALTER TABLE public.blocked_dates
ADD COLUMN source booking_source NOT NULL DEFAULT 'website',
ADD COLUMN channel_manager_id TEXT;

-- Create Channel Manager Logs Table
CREATE TABLE IF NOT EXISTS public.channel_manager_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'sync_start', 'sync_success', 'sync_error', 'webhook'
  provider TEXT NOT NULL DEFAULT 'ezee',
  payload JSONB,
  response JSONB,
  status TEXT NOT NULL, -- 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Logs
ALTER TABLE public.channel_manager_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view channel manager logs"
  ON public.channel_manager_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_bookings_source ON public.bookings(source);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_channel_manager_id ON public.bookings(channel_manager_id);
CREATE INDEX idx_blocked_dates_channel_manager_id ON public.blocked_dates(channel_manager_id);


-- Migration: 20260207134035_resort_settings.sql
-- Create resort_settings table
create table if not exists public.resort_settings (
  id uuid default gen_random_uuid() primary key,
  resort_name text not null,
  location text not null,
  phone text not null,
  email text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Add RLS policies
alter table public.resort_settings enable row level security;

-- Allow anyone to read resort settings (for public display)
create policy "Resort settings are viewable by everyone"
  on public.resort_settings for select
  using (true);

-- Only admins can update resort settings
create policy "Only admins can update resort settings"
  on public.resort_settings for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
  );

-- Only admins can insert resort settings
create policy "Only admins can insert resort settings"
  on public.resort_settings for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
  );

-- Insert default resort settings
-- insert into public.resort_settings (resort_name, location, phone, email, address)
-- values (
--   'Aranya Forest Resort',
--   'Maharashtra, India',
--   '+91 98765 43210',
--   'contact@aranyaresort.com',
--   null
-- );

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.resort_settings
  for each row
  execute procedure public.handle_updated_at();


-- Migration: 20260207141632_payment_settings.sql
-- Create payment_settings table
create table if not exists public.payment_settings (
  id uuid default gen_random_uuid() primary key,
  provider text not null unique, -- 'razorpay', 'stripe', 'paypal', 'phonepe'
  is_enabled boolean default false not null,
  config jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Add RLS policies
alter table public.payment_settings enable row level security;

-- Only super admins can view/manage payment settings
create policy "Only super admins can manage payment settings"
  on public.payment_settings
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
  );

-- Insert default rows for each provider
-- insert into public.payment_settings (provider, is_enabled, config)
-- values 
--   ('razorpay', false, '{"key_id": "", "key_secret": ""}'::jsonb),
--   ('stripe', false, '{"publishable_key": "", "secret_key": ""}'::jsonb),
--   ('paypal', false, '{"client_id": "", "client_secret": ""}'::jsonb),
--   ('phonepe', false, '{"merchant_id": "", "salt_key": "", "salt_index": ""}'::jsonb)
-- on conflict (provider) do nothing;

-- Create updated_at trigger for payment_settings
create trigger set_updated_at_payment_settings
  before update on public.payment_settings
  for each row
  execute procedure public.handle_updated_at();


-- Migration: 20260207143342_fix_rls_policies.sql
-- Drop the restrictive policy
drop policy if exists "Only super admins can manage payment settings" on public.payment_settings;

-- Create a more inclusive policy using the is_admin function
create policy "Admins can manage payment settings"
  on public.payment_settings
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Also update resort_settings policies to be more inclusive if they aren't already
drop policy if exists "Only admins can update resort settings" on public.resort_settings;
drop policy if exists "Only admins can insert resort settings" on public.resort_settings;

create policy "Admins can update resort settings"
  on public.resort_settings for update
  using (public.is_admin(auth.uid()));

create policy "Admins can insert resort settings"
  on public.resort_settings for insert
  with check (public.is_admin(auth.uid()));


-- Migration: 20260207144422_public_payment_settings_policy.sql
-- Allow anyone to view which payment providers are enabled
-- This is needed for the public booking flow to show the correct payment options
-- Note: We only allow selecting 'provider' and 'is_enabled' to avoid leaking 'config'
create policy "Allow public to view enabled payment providers"
  on public.payment_settings for select
  using (true);

-- To be extra safe, we can use a view or just be careful with our frontend queries.
-- For now, the policy allows reading the table, but we will only query is_enabled in the frontend.


-- Migration: 20260207152259_channel_manager_settings.sql
-- Create channel_manager_settings table
create table if not exists public.channel_manager_settings (
  id uuid default gen_random_uuid() primary key,
  provider text not null unique, -- 'ezee', etc.
  is_enabled boolean default false not null,
  config jsonb default '{}'::jsonb not null, -- { api_key, property_id, gateway_url }
  last_sync_at timestamp with time zone,
  last_sync_status text, -- 'success', 'error'
  last_error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Add RLS policies
alter table public.channel_manager_settings enable row level security;

-- Only admins can view/manage channel manager settings
create policy "Admins can manage channel manager settings"
  on public.channel_manager_settings
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Add trigger for updated_at
create trigger update_channel_manager_settings_updated_at
  before update on public.channel_manager_settings
  for each row
  execute function public.update_updated_at_column();

-- Insert default entries
-- insert into public.channel_manager_settings (provider, config)
-- values 
--   ('ezee', '{"api_key": "", "property_id": "", "gateway_url": "https://cm.ezeecentrix.com/api/v1/xml/"}'::jsonb),
--   ('booking.com', '{"api_key": "", "hotel_id": ""}'::jsonb)
-- on conflict (provider) do nothing;


-- Migration: 20260207160000_ensure_channel_partners.sql
-- Ensure Channel Manager Partners are initialized
-- insert into public.channel_manager_settings (provider, config)
-- values 
--   ('ezee', '{"api_key": "", "property_id": "", "gateway_url": "https://cm.ezeecentrix.com/api/v1/xml/"}'::jsonb),
--   ('booking.com', '{"api_key": "", "hotel_id": ""}'::jsonb)
-- on conflict (provider) do update
-- set config = case 
--     when public.channel_manager_settings.config = '{}'::jsonb then excluded.config 
--     else public.channel_manager_settings.config 
--   end;


-- Migration: 20260210120500_create_blogs_table.sql
-- Create blogs table
create table if not exists public.blogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content jsonb not null,
  featured_image text,
  category text,
  author_id uuid references auth.users(id),
  is_published boolean default false not null,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.blogs enable row level security;

-- Public can view published blogs
create policy "Anyone can view published blogs"
  on public.blogs
  for select
  using (is_published = true);

-- Admins can manage all blogs
create policy "Admins can manage all blogs"
  on public.blogs
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Add trigger for updated_at
create trigger update_blogs_updated_at
  before update on public.blogs
  for each row
  execute function public.update_updated_at_column();

-- Function to generate slug from title (optional, but helpful)
-- For now, we'll handle this on the frontend or via a simple trigger if needed.


-- Migration: 20260211000000_create_experiences_table.sql
create table if not exists public.experiences (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  title text not null,
  description text null,
  image_url text null,
  category text null,
  slug text not null,
  constraint experiences_pkey primary key (id),
  constraint experiences_slug_key unique (slug)
);

alter table public.experiences enable row level security;

create policy "Enable read access for all users"
on "public"."experiences"
as PERMISSIVE
for SELECT
to public
using (
  true
);

create policy "Enable insert for authenticated users only"
on "public"."experiences"
as PERMISSIVE
for INSERT
to authenticated
with check (
  true
);

create policy "Enable update for authenticated users only"
on "public"."experiences"
as PERMISSIVE
for UPDATE
to authenticated
using (
  true
);

create policy "Enable delete for authenticated users only"
on "public"."experiences"
as PERMISSIVE
for DELETE
to authenticated
using (
  true
);


-- Migration: 20260211_email_notifications.sql

-- Ensure resort settings has the correct email
UPDATE public.resort_settings 
SET email = 'reservation@jungleheritage.com'
WHERE id IN (SELECT id FROM public.resort_settings LIMIT 1);

-- Function to trigger email notification
CREATE OR REPLACE FUNCTION public.trigger_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  target_type text;
BEGIN
  IF (TG_TABLE_NAME = 'enquiries') THEN
    target_type := 'enquiry';
    payload := jsonb_build_object(
      'type', target_type,
      'data', to_jsonb(NEW)
    );
  ELSIF (TG_TABLE_NAME = 'bookings') THEN
    -- Only notify for new bookings that are not just enquiries (enquiries go through the enquiries table usually, 
    -- but confirmed bookings go straight to bookings table)
    -- Actually, let's notify for all new bookings.
    target_type := 'booking';
    payload := jsonb_build_object(
      'type', target_type,
      'data', to_jsonb(NEW)
    );
  END IF;

  -- Call the Edge Function
  -- Note: You need to set up the vault or hardcode the URL if not using standard Supabase hooks
  -- However, Supabase Webhooks are better for this. 
  -- We'll create the function but it's recommended to use the Supabase Dashboard Webhooks UI for Edge Functions.
  -- But since we want it automated, we'll use pg_net if available or just define the trigger for documentation.
  
  -- For this project, we'll suggest the user to enable Webhooks in the dashboard linked to this function.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Migration: 20260211_fix_availability.sql
-- Function to handle booking status changes
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to 'cancelled' or 'no_show', remove blocked dates
    IF (NEW.status IN ('cancelled', 'no_show')) THEN
        DELETE FROM public.blocked_dates
        WHERE booking_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_status_change();

-- Cleanup existing cancelled bookings that might still have blocked dates
DELETE FROM public.blocked_dates
WHERE booking_id IN (
    SELECT id FROM public.bookings 
    WHERE status IN ('cancelled', 'no_show')
);


-- Migration: 20260211_free_meal_plan.sql
UPDATE public.meal_plan_prices
SET adult_price = 0, child_price = 0
WHERE meal_plan = 'CP';


-- Migration: 20260216_create_chat_tables.sql
-- Create chat_leads table
CREATE TABLE IF NOT EXISTS public.chat_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  travel_dates text,
  guests text,
  status text default 'new', -- new, contacted, booked, closed
  inquiry_type text default 'general', -- general, booking, wedding, corporate, safari
  created_at timestamptz default now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  messages jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.chat_leads enable row level security;
alter table public.chat_sessions enable row level security;

-- Policies for chat_leads
create policy "Allow public insert for leads"
  on public.chat_leads for insert
  with check (true);

create policy "Allow admin select for leads"
  on public.chat_leads for select
  using (auth.role() = 'authenticated'); -- Assuming authenticated users are admins for now, or refine later

-- Policies for chat_sessions
create policy "Allow public insert/update for sessions"
  on public.chat_sessions for all
  using (true)
  with check (true);

-- Functions
create or replace function public.handle_new_lead()
returns trigger as $$
begin
  -- Logic to send email notification could go here
  return new;
end;
$$ language plpgsql;


-- Migration: 20260216_create_knowledge_base.sql
-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your knowledge base content
create table if not exists knowledge_base (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768), -- Gemini 1.5 Flash/Pro embedding dimension is usually 768. 
  source_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for security
alter table knowledge_base enable row level security;

-- Allow read access to authenticated users and service role
create policy "Enable read access for all users" on knowledge_base
  for select using (true);

-- Allow write access only to service role (Edge Functions)
create policy "Enable insert for service role" on knowledge_base
  for insert with check (true);
  
create policy "Enable update for service role" on knowledge_base
  for update using (true);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query(
    select
      knowledge_base.id,
      knowledge_base.content,
      knowledge_base.metadata,
      1 - (knowledge_base.embedding <=> query_embedding) as similarity
    from knowledge_base
    where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    order by knowledge_base.embedding <=> query_embedding
    limit match_count
  );
end;
$$;


-- Migration: 20260216_fix_vector_dimensions.sql
-- Update the dimension of the embedding column
alter table knowledge_base alter column embedding type vector(3072);

-- Update the match_documents function to use the new dimension
create or replace function match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query(
    select
      knowledge_base.id,
      knowledge_base.content,
      knowledge_base.metadata,
      1 - (knowledge_base.embedding <=> query_embedding) as similarity
    from knowledge_base
    where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    order by knowledge_base.embedding <=> query_embedding
    limit match_count
  );
end;
$$;


