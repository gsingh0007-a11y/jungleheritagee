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