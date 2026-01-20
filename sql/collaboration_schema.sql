-- Collaboration & Chat Schema

-- 1. Groups Table (for collaborative projects/study groups)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  group_code TEXT UNIQUE NOT NULL, -- e.g., 'ZXDFETPR' for joining
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Group Members Table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. Chat Sessions Table (can be 1:1 or Group)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional, if linked to a group
  type TEXT DEFAULT 'direct', -- 'direct', 'group'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Chat Participants Table (for 1:1 chats mainly, or caching group members)
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 5. Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE -- Simple read status, for group chats use chat_participants.last_read_at
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Groups Policies
CREATE POLICY "Public groups are viewable by everyone" ON groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Admins can update groups" ON groups FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Group Members Policies
CREATE POLICY "Members can view other members" ON group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join open groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Policies
-- Users can see sessions they are part of OR sessions linked to groups they are members of
CREATE POLICY "Users can view their chat sessions" ON chat_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants WHERE session_id = chat_sessions.id AND user_id = auth.uid()
  ) OR (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members WHERE group_id = chat_sessions.group_id AND user_id = auth.uid()
    )
  )
);

-- Messages Policies
CREATE POLICY "Users can view messages in their sessions" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp WHERE cp.session_id = messages.session_id AND cp.user_id = auth.uid()
  ) OR (
    EXISTS (
      SELECT 1 FROM chat_sessions cs 
      JOIN group_members gm ON cs.group_id = gm.group_id 
      WHERE cs.id = messages.session_id AND gm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert messages in their sessions" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (
      SELECT 1 FROM chat_participants cp WHERE cp.session_id = messages.session_id AND cp.user_id = auth.uid()
    ) OR (
      EXISTS (
        SELECT 1 FROM chat_sessions cs 
        JOIN group_members gm ON cs.group_id = gm.group_id 
        WHERE cs.id = messages.session_id AND gm.user_id = auth.uid()
      )
    )
  )
);
