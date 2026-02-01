-- Boat Gallery table for storing photos and videos
CREATE TABLE IF NOT EXISTS boat_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  mime_type TEXT, -- e.g., 'image/jpeg', 'video/mp4'
  file_size INTEGER,
  caption TEXT,
  taken_at TIMESTAMPTZ, -- when photo/video was taken (from EXIF or user input)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_boat_id ON boat_gallery(boat_id);
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON boat_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON boat_gallery(created_at DESC);

-- RLS policies
ALTER TABLE boat_gallery ENABLE ROW LEVEL SECURITY;

-- Users can only see gallery items for their own boats
CREATE POLICY "Users can view own boat gallery" ON boat_gallery
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Users can insert gallery items for their own boats
CREATE POLICY "Users can insert own boat gallery" ON boat_gallery
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Users can delete their own gallery items
CREATE POLICY "Users can delete own boat gallery" ON boat_gallery
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Users can update their own gallery items (captions etc)
CREATE POLICY "Users can update own boat gallery" ON boat_gallery
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

COMMENT ON TABLE boat_gallery IS 'Photo and video gallery for boats - general media not tied to maintenance';
