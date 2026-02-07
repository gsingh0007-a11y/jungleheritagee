-- Ensure Channel Manager Partners are initialized
insert into public.channel_manager_settings (provider, config)
values 
  ('ezee', '{"api_key": "", "property_id": "", "gateway_url": "https://cm.ezeecentrix.com/api/v1/xml/"}'::jsonb),
  ('booking.com', '{"api_key": "", "hotel_id": ""}'::jsonb)
on conflict (provider) do update
set config = case 
    when public.channel_manager_settings.config = '{}'::jsonb then excluded.config 
    else public.channel_manager_settings.config 
  end;
