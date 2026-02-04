-- Fix Collaboration Schema: Add missing tables detected in frontend code

-- 1. Group Messages Table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Group Files Table
CREATE TABLE IF NOT EXISTS group_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Group Join Requests Table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id) -- One active request per user per group
);

-- Enable Row Level Security (RLS)
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can view files" ON group_files;
DROP POLICY IF EXISTS "Group members can upload files" ON group_files;
DROP POLICY IF EXISTS "Users can create join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group admins can view requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group admins can update requests" ON group_join_requests;

-- Group Messages: Visible to members, Insertable by members
CREATE POLICY "Group members can view messages" ON group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_messages.group_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages" ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_messages.group_id
      AND user_id = auth.uid()
    )
  );

-- Group Files: Visible to members, Uploadable by members
CREATE POLICY "Group members can view files" ON group_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_files.group_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can upload files" ON group_files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_files.group_id
      AND user_id = auth.uid()
    )
  );

-- Join Requests: Users can create, Admins can view/update
CREATE POLICY "Users can create join requests" ON group_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view their own requests" ON group_join_requests
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Group admins can view requests" ON group_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_join_requests.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Group admins can update requests" ON group_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_join_requests.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
