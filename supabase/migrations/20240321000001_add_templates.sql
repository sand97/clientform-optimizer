-- Create templates table
CREATE TABLE templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  positions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own templates
CREATE POLICY "Users can view their own templates"
ON templates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy to allow users to create templates
CREATE POLICY "Users can create templates"
ON templates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own templates
CREATE POLICY "Users can update their own templates"
ON templates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to delete their own templates
CREATE POLICY "Users can delete their own templates"
ON templates
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 