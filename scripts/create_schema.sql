-- STEP 2: SCHEMA CREATION (squashed, topo-sorted, stale-policy-pruned)

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- ====== TYPES ======
DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'app_role' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'staff', 'guest');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'booking_status' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.booking_status AS ENUM ('new_enquiry', 'enquiry_responded', 'quote_sent', 'booking_confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'meal_plan' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.meal_plan AS ENUM ('EP', 'CP', 'MAP', 'AP');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'room_status' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.room_status AS ENUM ('active', 'inactive', 'maintenance');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'package_type' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.package_type AS ENUM ('honeymoon', 'safari', 'family', 'corporate', 'weekend', 'wedding', 'seasonal');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'season_type' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.season_type AS ENUM ('peak', 'regular', 'off_peak');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'booking_source' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.booking_source AS ENUM ('website', 'channel_manager', 'admin');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'payment_status' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
    END IF;
END $$;

-- ====== TABLES ======
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

CREATE TABLE IF NOT EXISTS public.user_roles (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)

);

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
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
    channel_manager_id TEXT,
    payment_id TEXT,
    payment_provider TEXT
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (

    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    blocked_date date NOT NULL,
    reason text NOT NULL DEFAULT 'booking' CHECK (reason IN ('booking', 'maintenance', 'private', 'other')),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(room_id, blocked_date),
    source booking_source NOT NULL DEFAULT 'website',
    channel_manager_id TEXT
);

CREATE TABLE IF NOT EXISTS public.tax_config (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.enquiries (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    category text NOT NULL DEFAULT 'contact'
);

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

CREATE TABLE IF NOT EXISTS public.experiences (

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

CREATE TABLE IF NOT EXISTS public.resort_settings (

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

CREATE TABLE IF NOT EXISTS public.payment_settings (

  id uuid default gen_random_uuid() primary key,
  provider text not null unique, -- 'razorpay', 'stripe', 'paypal', 'phonepe'
  is_enabled boolean default false not null,
  config jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)

);

CREATE TABLE IF NOT EXISTS public.channel_manager_settings (

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

CREATE TABLE IF NOT EXISTS public.blogs (

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

CREATE TABLE IF NOT EXISTS public.chat_sessions (

  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  messages jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()

);

CREATE TABLE IF NOT EXISTS public.knowledge_base (

  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768), -- Gemini 1.5 Flash/Pro embedding dimension is usually 768. 
  source_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())

);

-- ====== FUNCTIONS ======

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


create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


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
        INSERT INTO public.blocked_dates (room_id, blocked_date, reason, booking_id)
        VALUES (_room_id, curr_date, 'booking', _booking_id)
        ON CONFLICT (room_id, blocked_date) DO UPDATE SET booking_id = EXCLUDED.booking_id;
        curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
END;
$$;


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


create or replace function public.handle_new_lead()
returns trigger as $$
begin
  -- Logic to send email notification could go here
  return new;
end;
$$ language plpgsql;


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

-- ====== ENABLE RLS ======
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_manager_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resort_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_manager_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- ====== POLICIES ======
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active seasons"
ON public.seasons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage seasons"
ON public.seasons FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active room categories"
ON public.room_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all room categories"
ON public.room_categories FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active meal plans"
ON public.meal_plan_prices FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage meal plans"
ON public.meal_plan_prices FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own pending bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status IN ('new_enquiry', 'enquiry_responded'));

CREATE POLICY "Anyone can view blocked dates"
ON public.blocked_dates
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view active taxes"
ON public.tax_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage taxes"
ON public.tax_config FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert staff roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') 
  AND role != 'super_admin'
);

CREATE POLICY "Super admins can delete staff roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') 
  AND role != 'super_admin'
);

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

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

CREATE POLICY "Admins can view all packages"
ON public.packages FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

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

CREATE POLICY "Anon can create enquiries"
ON public.bookings FOR INSERT
TO anon
WITH CHECK (is_enquiry_only = true);

CREATE POLICY "Admins can update all bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can create enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view enquiries"
ON public.enquiries FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update enquiries"
ON public.enquiries FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can delete enquiries"
ON public.enquiries FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Public can submit contact enquiries"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL 
    AND email IS NOT NULL 
    AND message IS NOT NULL
);

CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all gallery images"
ON public.gallery_images
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete gallery images"
ON public.gallery_images
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can view active rooms"
ON public.rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all rooms"
ON public.rooms
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert rooms"
ON public.rooms
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update rooms"
ON public.rooms
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete rooms"
ON public.rooms
    FOR DELETE USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert blocked dates"
ON public.blocked_dates
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update blocked dates"
ON public.blocked_dates
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete blocked dates"
ON public.blocked_dates
    FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active reviews"
ON public.reviews FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete reviews"
ON public.reviews FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view channel manager logs"
ON public.channel_manager_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Resort settings are viewable by everyone"
ON public.resort_settings for select
  using (true);

CREATE POLICY "Only admins can update resort settings"
ON public.resort_settings for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Only admins can insert resort settings"
ON public.resort_settings for insert
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Only super admins can manage payment settings"
ON public.payment_settings
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

CREATE POLICY "Admins can manage payment settings"
ON public.payment_settings
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update resort settings"
ON public.resort_settings for update
  using (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert resort settings"
ON public.resort_settings for insert
  with check (public.is_admin(auth.uid()));

CREATE POLICY "Allow public to view enabled payment providers"
ON public.payment_settings for select
  using (true);

CREATE POLICY "Admins can manage channel manager settings"
ON public.channel_manager_settings
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view published blogs"
ON public.blogs
  for select
  using (is_published = true);

CREATE POLICY "Admins can manage all blogs"
ON public.blogs
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

CREATE POLICY "Allow public insert for leads"
ON public.chat_leads for insert
  with check (true);

CREATE POLICY "Allow admin select for leads"
ON public.chat_leads for select
  using (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert/update for sessions"
ON public.chat_sessions for all
  using (true)
  with check (true);

-- ====== TRIGGERS ======
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;


CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_room_categories_updated_at ON public.room_categories;


CREATE TRIGGER trigger_room_categories_updated_at
  BEFORE UPDATE ON public.room_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_packages_updated_at ON public.packages;


CREATE TRIGGER trigger_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;


CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_seasons_updated_at ON public.seasons;


CREATE TRIGGER trigger_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_meal_plan_prices_updated_at ON public.meal_plan_prices;


CREATE TRIGGER trigger_meal_plan_prices_updated_at
  BEFORE UPDATE ON public.meal_plan_prices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_booking_reference ON public.bookings;

CREATE TRIGGER set_booking_reference
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.generate_booking_reference();

DROP TRIGGER IF EXISTS update_room_categories_updated_at ON public.room_categories;

CREATE TRIGGER update_room_categories_updated_at
BEFORE UPDATE ON public.room_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;


CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;


CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gallery_images_updated_at ON public.gallery_images;

CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_experiences_updated_at ON public.experiences;

CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.resort_settings;


create trigger set_updated_at
  before update on public.resort_settings
  for each row
  execute procedure public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_payment_settings ON public.payment_settings;

create trigger set_updated_at_payment_settings
  before update on public.payment_settings
  for each row
  execute procedure public.handle_updated_at();

DROP TRIGGER IF EXISTS update_channel_manager_settings_updated_at ON public.channel_manager_settings;

create trigger update_channel_manager_settings_updated_at
  before update on public.channel_manager_settings
  for each row
  execute function public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;

create trigger update_blogs_updated_at
  before update on public.blogs
  for each row
  execute function public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;

CREATE TRIGGER on_booking_status_change
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_status_change();

