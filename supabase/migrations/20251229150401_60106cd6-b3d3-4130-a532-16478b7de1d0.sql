-- Add deadline_start column for from/to date support in stages
ALTER TABLE public.event_stages ADD COLUMN IF NOT EXISTS deadline_start timestamp with time zone;

-- Rename deadline to deadline_end for clarity
ALTER TABLE public.event_stages RENAME COLUMN deadline TO deadline_end;

-- Create table for dismissed notifications to prevent repeated reminders
CREATE TABLE IF NOT EXISTS public.dismissed_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_key TEXT NOT NULL,
  dismissed_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_key)
);

-- Enable RLS on dismissed_notifications
ALTER TABLE public.dismissed_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dismissed_notifications
CREATE POLICY "Users can view their own dismissed notifications"
ON public.dismissed_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed notifications"
ON public.dismissed_notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dismissed notifications"
ON public.dismissed_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed notifications"
ON public.dismissed_notifications FOR DELETE
USING (auth.uid() = user_id);