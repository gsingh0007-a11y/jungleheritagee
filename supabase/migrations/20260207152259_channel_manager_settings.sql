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
insert into public.channel_manager_settings (provider, config)
values 
  ('ezee', '{"api_key": "", "property_id": "", "gateway_url": "https://cm.ezeecentrix.com/api/v1/xml/"}'::jsonb),
  ('booking.com', '{"api_key": "", "hotel_id": ""}'::jsonb)
on conflict (provider) do nothing;
