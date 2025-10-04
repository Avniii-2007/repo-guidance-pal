-- Create the voice-messages storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true);

-- Set up RLS policies for voice messages bucket
CREATE POLICY "Users can upload their own voice messages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view voice messages in conversations they're part of"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'voice-messages' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE (m.sender_id = auth.uid() OR m.receiver_id = auth.uid()) 
      AND m.content LIKE '%' || name || '%'
    )
  )
);

-- Optional: Add columns to messages table for better voice message support
-- (You can run this if you want proper voice message columns)
-- ALTER TABLE messages 
-- ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'voice')),
-- ADD COLUMN voice_message_url text,
-- ADD COLUMN voice_duration integer;