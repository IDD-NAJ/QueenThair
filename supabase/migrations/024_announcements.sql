-- Announcements/Promotional Banners Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Public can view active announcements
CREATE POLICY "Anyone can view active announcements"
  ON announcements
  FOR SELECT
  USING (is_active = true);

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  USING (is_admin());

-- Update timestamp trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial announcements
INSERT INTO announcements (title, icon, sort_order, is_active) VALUES
  ('Free shipping on orders over $89', '🚚', 1, true),
  ('Use code QUEEN20 for 20% off', '🎉', 2, true),
  ('100% Human Hair Guarantee', '✨', 3, true),
  ('30-Day Returns', '↩️', 4, true)
ON CONFLICT DO NOTHING;
