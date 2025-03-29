-- Add original_pdf_name column
ALTER TABLE templates
ADD COLUMN original_pdf_name TEXT NOT NULL DEFAULT '';

-- Remove created_at column
ALTER TABLE templates
DROP COLUMN created_at; 