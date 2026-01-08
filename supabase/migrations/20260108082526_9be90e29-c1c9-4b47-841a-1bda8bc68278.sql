-- Create storage bucket for reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true);

-- Create table to store reference image metadata
CREATE TABLE public.reference_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT DEFAULT 'default',
  embedding JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_images ENABLE ROW LEVEL SECURITY;

-- Public read access for reference images (no auth required for demo)
CREATE POLICY "Anyone can view reference images"
ON public.reference_images
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert reference images"
ON public.reference_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete reference images"
ON public.reference_images
FOR DELETE
USING (true);

-- Storage policies for reference-images bucket
CREATE POLICY "Public read access for reference images"
ON storage.objects FOR SELECT
USING (bucket_id = 'reference-images');

CREATE POLICY "Anyone can upload reference images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reference-images');

CREATE POLICY "Anyone can delete reference images from storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'reference-images');