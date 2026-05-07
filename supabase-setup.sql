-- ============================================================
-- PitHouse Presets — Supabase Setup
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- 1. Presets table
CREATE TABLE IF NOT EXISTS presets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  wheelbase        TEXT NOT NULL,
  game             TEXT NOT NULL,
  description      TEXT,
  file_path        TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  downloads        INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id   UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  fingerprint TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by preset
CREATE INDEX IF NOT EXISTS ratings_preset_id_idx ON ratings(preset_id);

-- Unique constraint: one rating per fingerprint per preset
CREATE UNIQUE INDEX IF NOT EXISTS ratings_unique_fp
  ON ratings(preset_id, fingerprint);

-- 3. Helper function to atomically increment the download counter
CREATE OR REPLACE FUNCTION increment_downloads(preset_id UUID)
RETURNS VOID AS $$
  UPDATE presets SET downloads = downloads + 1 WHERE id = preset_id;
$$ LANGUAGE SQL;

-- 4. Row-Level Security (RLS)
-- Enable RLS on both tables
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Public can read all presets
CREATE POLICY "Public read presets"
  ON presets FOR SELECT USING (true);

-- Service role (used by API routes) can do everything
-- (Service role bypasses RLS automatically — no policy needed for it)

-- Public can read ratings
CREATE POLICY "Public read ratings"
  ON ratings FOR SELECT USING (true);

-- Public can insert ratings (the API validates the data before inserting)
CREATE POLICY "Public insert ratings"
  ON ratings FOR INSERT WITH CHECK (true);

-- Public can update their own rating (matched by fingerprint)
CREATE POLICY "Public update own rating"
  ON ratings FOR UPDATE USING (true);

-- 5. Storage bucket
-- In the Supabase dashboard: Storage → New bucket → Name: "presets" → Private
-- Then add the following storage policy so the API can read/write files:
--
-- Policy name: "Service role full access"
-- Allowed operation: ALL
-- Target roles: service_role
--
-- And for public signed URL reads (already handled by createSignedUrl):
-- No additional policy needed — signed URLs work without a public bucket policy.
