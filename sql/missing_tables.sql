-- Missing Collaboration Tables Migration

-- 1. Group Join Requests (for closed groups)
CREATE TABLE group_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id)
);

-- 2. Group Messages (Group Wall/Board)
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Group Files
CREATE TABLE group_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES

ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_files ENABLE ROW LEVEL SECURITY;

-- Join Requests Policies
CREATE POLICY "Users can create join requests" ON group_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own requests" ON group_join_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view group requests" ON group_join_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_join_requests.group_id AND user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can update requests" ON group_join_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_join_requests.group_id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Group Messages Policies
CREATE POLICY "Members can view messages" ON group_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Members can post messages" ON group_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  )
);

-- Group Files Policies
CREATE POLICY "Members can view files" ON group_files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_files.group_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Members can upload files" ON group_files FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_files.group_id AND user_id = auth.uid()
  )
);
