-- Create the storage bucket for profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update ownavatar" ON storage.objects;

-- Policy to allow public access to view images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'profile-images' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Uploads" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated'
  );

-- Policy to allow users to update/delete their own images (optional but good practice)
-- Assumes file name starts with user_id or similar pattern, or just allow common access for demo
CREATE POLICY "Users can update own items" ON storage.objects
  FOR UPDATE
  USING ( bucket_id = 'profile-images' AND auth.role() = 'authenticated' );
