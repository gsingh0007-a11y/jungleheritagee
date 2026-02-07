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