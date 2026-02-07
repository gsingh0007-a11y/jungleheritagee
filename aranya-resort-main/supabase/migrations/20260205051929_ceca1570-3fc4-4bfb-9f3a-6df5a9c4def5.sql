-- Create experiences table
CREATE TABLE public.experiences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    long_description TEXT,
    duration TEXT,
    best_time TEXT,
    image_url TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active experiences" 
ON public.experiences 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all experiences" 
ON public.experiences 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert experiences" 
ON public.experiences 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update experiences" 
ON public.experiences 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete experiences" 
ON public.experiences 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for experience images
INSERT INTO storage.buckets (id, name, public) VALUES ('experiences', 'experiences', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for experiences bucket
CREATE POLICY "Anyone can view experience images"
ON storage.objects FOR SELECT
USING (bucket_id = 'experiences');

CREATE POLICY "Admins can upload experience images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'experiences' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update experience images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'experiences' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete experience images"
ON storage.objects FOR DELETE
USING (bucket_id = 'experiences' AND is_admin(auth.uid()));