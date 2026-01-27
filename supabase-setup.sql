-- Messages table for chat with Pete
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'pete')),
  attachments JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow public access (same as tasks)
CREATE POLICY "Allow all access to messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create storage bucket for uploads (run in SQL editor)
-- Note: Storage bucket creation is usually done via Dashboard
-- Go to Storage > Create bucket > Name: "uploads" > Public bucket: Yes
