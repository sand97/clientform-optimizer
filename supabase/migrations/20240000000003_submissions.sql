-- Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id),
    template_id UUID NOT NULL REFERENCES templates(id),
    template_data JSONB NOT NULL, -- Snapshot of template at submission time
    form_data JSONB NOT NULL, -- Snapshot of form and fields at submission time
    field_values JSONB NOT NULL, -- User submitted values
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id)
);

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX submissions_form_id_idx ON submissions(form_id);
CREATE INDEX submissions_template_id_idx ON submissions(template_id);
CREATE INDEX submissions_organization_id_idx ON submissions(organization_id);

-- Policy for inserting submissions (anyone can submit)
CREATE POLICY "Anyone can submit forms"
ON submissions FOR INSERT
TO public
WITH CHECK (true);

-- Policy for viewing submissions (form creator or organization member)
CREATE POLICY "Users can view their own form submissions"
ON submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM forms
        WHERE forms.id = submissions.form_id
        AND (
            -- Form creator can view
            forms.user_id = auth.uid()
            OR
            -- Organization members can view
            (
                forms.organization_id IS NOT NULL
                AND forms.organization_id = submissions.organization_id
                AND EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_members.organization_id = forms.organization_id
                    AND organization_members.user_id = auth.uid()
                )
            )
        )
    )
);

-- Function to automatically set organization_id from form
CREATE OR REPLACE FUNCTION set_submission_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.organization_id := (
        SELECT organization_id
        FROM forms
        WHERE id = NEW.form_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set organization_id before insert
CREATE TRIGGER set_submission_organization_id_trigger
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION set_submission_organization_id();

-- Grant permissions
GRANT ALL ON submissions TO service_role;
GRANT SELECT, INSERT ON submissions TO authenticated;
GRANT INSERT ON submissions TO anon; 