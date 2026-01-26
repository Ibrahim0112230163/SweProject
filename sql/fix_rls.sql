-- Fix RLS Policies for Group Members

-- Drop existing restrictive policy if it conflicts (or we can just add a new enabling one)
-- Supabase policies are OR-ed, so adding a permissive one works.

-- 1. Allow users to view their OWN membership record specifically
-- This fixes the "chicken and egg" problem where you can't see the group members list
-- because you haven't been "verified" as a member by the recursive policy yet.
CREATE POLICY "Users can view their own membership" ON group_members 
FOR SELECT USING (auth.uid() = user_id);

-- 2. Allow Group Creators to view all members of their groups
-- Even if the creator somehow isn't in group_members (shouldn't happen, but safety net),
-- they should be able to see who is in the groups they own.
CREATE POLICY "Creators can view members of their groups" ON group_members 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()
  )
);

-- 3. Ensure Group Creators can always manage members
CREATE POLICY "Creators can manage members" ON group_members 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM groups WHERE id = group_members.group_id AND creator_id = auth.uid()
  )
);
