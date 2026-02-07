-- Create storage bucket for room images
INSERT INTO storage.buckets (id, name, public) VALUES ('rooms', 'rooms', true);

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