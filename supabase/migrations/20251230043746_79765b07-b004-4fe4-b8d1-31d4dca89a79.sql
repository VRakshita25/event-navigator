-- Make the event-attachments bucket public so files can be accessed
UPDATE storage.buckets SET public = true WHERE id = 'event-attachments';

-- Add storage policies for the bucket
CREATE POLICY "Users can upload their own attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view event attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-attachments');