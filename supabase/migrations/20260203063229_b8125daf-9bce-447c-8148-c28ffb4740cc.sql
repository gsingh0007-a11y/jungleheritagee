-- Add category column to enquiries table for distinguishing contact vs job applications
ALTER TABLE public.enquiries 
ADD COLUMN category text NOT NULL DEFAULT 'contact';

-- Add a comment to explain the column
COMMENT ON COLUMN public.enquiries.category IS 'Category of enquiry: contact or job_application';