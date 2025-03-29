-- Enable RLS on templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert their own templates
CREATE POLICY "Users can create their own templates"
ON templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = form_id);

-- Policy to allow users to view their own templates
CREATE POLICY "Users can view their own templates"
ON templates FOR SELECT
TO authenticated
USING (auth.uid() = form_id);

-- Policy to allow users to update their own templates
CREATE POLICY "Users can update their own templates"
ON templates FOR UPDATE
TO authenticated
USING (auth.uid() = form_id)
WITH CHECK (auth.uid() = form_id); 