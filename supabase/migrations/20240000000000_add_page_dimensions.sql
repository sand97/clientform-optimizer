-- Add page dimensions columns to positions table
ALTER TABLE positions
ADD COLUMN page_width numeric NOT NULL DEFAULT 0,
ADD COLUMN page_height numeric NOT NULL DEFAULT 0;

-- Update RLS policy to include new columns
ALTER POLICY "Users can view positions for their organization's templates" ON positions
    USING (
        template_id IN (
            SELECT t.id
            FROM templates t
            WHERE t.organization_id = auth.jwt() ->> 'organization_id'::text
        )
    );

-- Update RLS policy for inserting positions
ALTER POLICY "Users can insert positions for their organization's templates" ON positions
    WITH CHECK (
        template_id IN (
            SELECT t.id
            FROM templates t
            WHERE t.organization_id = auth.jwt() ->> 'organization_id'::text
        )
    );

-- Update RLS policy for updating positions
ALTER POLICY "Users can update positions for their organization's templates" ON positions
    USING (
        template_id IN (
            SELECT t.id
            FROM templates t
            WHERE t.organization_id = auth.jwt() ->> 'organization_id'::text
        )
    )
    WITH CHECK (
        template_id IN (
            SELECT t.id
            FROM templates t
            WHERE t.organization_id = auth.jwt() ->> 'organization_id'::text
        )
    ); 