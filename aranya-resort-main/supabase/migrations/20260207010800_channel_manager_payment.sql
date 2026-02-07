-- Add Source Enum
CREATE TYPE public.booking_source AS ENUM ('website', 'channel_manager', 'admin');

-- Add Payment Status Enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

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
CREATE TABLE public.channel_manager_logs (
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
