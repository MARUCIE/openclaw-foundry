-- Migration v6: Add curation columns to skills table
-- tags (JSON), editorial_tagline (TEXT), trending_score (REAL)

ALTER TABLE skills ADD COLUMN tags TEXT DEFAULT '{}';
ALTER TABLE skills ADD COLUMN editorial_tagline TEXT DEFAULT '';
ALTER TABLE skills ADD COLUMN trending_score REAL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills(tags);
