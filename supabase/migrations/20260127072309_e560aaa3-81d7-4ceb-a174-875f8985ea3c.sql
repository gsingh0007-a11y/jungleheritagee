-- =====================================================
-- ARANYA RESORT BOOKING SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1. ENUMS
-- =====================================================

-- Admin roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'staff');

-- Booking status enum
CREATE TYPE public.booking_status AS ENUM (
  'new_enquiry',
  'pending_confirmation', 
  'confirmed',
  'cancelled',
  'completed'
);

-- Meal plan enum
CREATE TYPE public.meal_plan AS ENUM ('EP', 'CP', 'MAP', 'AP');

-- Room status enum
CREATE TYPE public.room_status AS ENUM ('active', 'inactive', 'maintenance');

-- Package type enum
CREATE TYPE public.package_type AS ENUM (
  'honeymoon',
  'safari',
  'family',
  'corporate',
  'weekend',
  'wedding',
  'seasonal'
);

-- Season type enum
CREATE TYPE public.season_type AS ENUM ('peak', 'regular', 'off_peak');

-- 2. PROFILES TABLE (for guest accounts)
-- =====================================================
CREATE TABLE public.profiles (
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
CREATE TABLE public.user_roles (
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
CREATE TABLE public.seasons (
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
CREATE TABLE public.room_categories (
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
CREATE TABLE public.meal_plan_prices (
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
CREATE TABLE public.packages (
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
CREATE TABLE public.bookings (
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
CREATE TABLE public.blocked_dates (
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
CREATE TABLE public.tax_config (
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
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
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
INSERT INTO public.meal_plan_prices (meal_plan, name, description, adult_price, child_price) VALUES
  ('EP', 'Room Only', 'European Plan - No meals included', 0, 0),
  ('CP', 'Breakfast', 'Continental Plan - Breakfast included', 800, 400),
  ('MAP', 'Breakfast + Dinner', 'Modified American Plan - Two meals included', 1500, 750),
  ('AP', 'All Meals', 'American Plan - All meals included', 2200, 1100);

-- Default tax config
INSERT INTO public.tax_config (name, percentage) VALUES
  ('GST', 18.00);

-- Default seasons (example)
INSERT INTO public.seasons (name, season_type, start_date, end_date, price_multiplier) VALUES
  ('Peak Season', 'peak', '2026-10-01', '2027-03-31', 1.25),
  ('Regular Season', 'regular', '2026-04-01', '2026-06-30', 1.00),
  ('Monsoon Off-Peak', 'off_peak', '2026-07-01', '2026-09-30', 0.85);

-- Sample room categories
INSERT INTO public.room_categories (name, slug, description, max_adults, max_children, base_occupancy, base_price_per_night, extra_adult_price, extra_child_price, total_rooms, sort_order) VALUES
  ('Forest Villa', 'forest-villa', 'Elegantly designed forest villas with private decks and panoramic jungle views. Perfect for couples and families seeking an authentic wilderness experience.', 3, 2, 2, 18000, 3500, 1800, 8, 1),
  ('Treehouse Suite', 'treehouse-suite', 'Perched above the forest floor, our Treehouse Suites offer an unparalleled connection with nature. Wake up to bird songs and watch the sunrise through the treetops.', 2, 1, 2, 25000, 0, 2000, 4, 2),
  ('Pool Villa', 'pool-villa', 'The epitome of luxury with a private infinity pool overlooking the forest. Perfect for honeymoons or those seeking the ultimate indulgence.', 4, 2, 2, 45000, 5000, 2500, 3, 3);