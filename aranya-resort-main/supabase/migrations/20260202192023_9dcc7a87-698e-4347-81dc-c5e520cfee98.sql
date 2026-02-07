-- Create gallery_images table
CREATE TABLE public.gallery_images (
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

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public can view active images
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images
FOR SELECT
USING (is_active = true);

-- Admins can view all
CREATE POLICY "Admins can view all gallery images"
ON public.gallery_images
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert
CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update
CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
USING (is_admin(auth.uid()));

-- Super admins can delete
CREATE POLICY "Super admins can delete gallery images"
ON public.gallery_images
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update gallery images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gallery' AND is_admin(auth.uid()));

CREATE POLICY "Super admins can delete gallery images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'super_admin'::app_role));