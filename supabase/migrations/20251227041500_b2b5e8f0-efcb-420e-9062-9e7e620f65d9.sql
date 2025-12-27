-- Add attachments table for event files and links
CREATE TABLE public.event_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'link')),
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments
CREATE POLICY "Users can view own event attachments"
ON public.event_attachments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()
));

CREATE POLICY "Users can insert own event attachments"
ON public.event_attachments
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete own event attachments"
ON public.event_attachments
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = event_attachments.event_id AND events.user_id = auth.uid()
));

-- Add sound notification preference column
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('event-attachments', 'event-attachments', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);