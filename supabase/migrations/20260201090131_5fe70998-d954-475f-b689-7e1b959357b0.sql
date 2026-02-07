-- Insert super_admin role for arpansadhu13@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('41f79de7-9917-406e-993c-e91dbe5de871', 'super_admin');

-- Create room_categories table
CREATE TABLE public.room_categories (
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
CREATE TABLE public.packages (
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
CREATE TYPE public.booking_status AS ENUM (
    'new_enquiry',
    'enquiry_responded',
    'quote_sent',
    'booking_confirmed',
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show'
);

-- Create bookings table
CREATE TABLE public.bookings (
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
CREATE TABLE public.enquiries (
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

-- Create function for generating booking reference
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