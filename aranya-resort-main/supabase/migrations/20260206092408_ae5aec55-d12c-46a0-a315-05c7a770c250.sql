-- Create reviews table
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_name text NOT NULL,
    reviewer_location text,
    occasion text,
    rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review_text text NOT NULL,
    source text DEFAULT 'google',
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view active reviews
CREATE POLICY "Anyone can view active reviews"
ON public.reviews FOR SELECT
USING (is_active = true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert reviews
CREATE POLICY "Admins can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (is_admin(auth.uid()));

-- Super admins can delete reviews
CREATE POLICY "Super admins can delete reviews"
ON public.reviews FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();