-- Create rooms table for individual room instances within categories
CREATE TABLE public.rooms (
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
CREATE TABLE public.blocked_dates (
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
        INSERT INTO public.blocked_dates (room_id, blocked_date, reason, booking_id)
        VALUES (_room_id, curr_date, 'booking', _booking_id)
        ON CONFLICT (room_id, blocked_date) DO UPDATE SET booking_id = EXCLUDED.booking_id;
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
INSERT INTO public.rooms (room_category_id, room_number, floor)
SELECT 
    rc.id,
    'R' || rc.display_order || '-' || gs.num,
    CEIL(gs.num::float / 2)::integer
FROM public.room_categories rc
CROSS JOIN LATERAL generate_series(1, rc.total_rooms) AS gs(num)
WHERE rc.is_active = true
ON CONFLICT (room_category_id, room_number) DO NOTHING;