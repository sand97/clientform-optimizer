-- Enable RLS on the tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to templates
CREATE POLICY "Templates are viewable by everyone"
ON templates FOR SELECT
TO public
USING (true);

-- Create policies for public read access to forms
CREATE POLICY "Forms are viewable by everyone"
ON forms FOR SELECT
TO public
USING (true);

-- Create policies for public read access to fields
CREATE POLICY "Fields are viewable by everyone"
ON fields FOR SELECT
TO public
USING (true);

-- Grant usage on the schema to the anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT permissions to the anon role
GRANT SELECT ON templates TO anon;
GRANT SELECT ON forms TO anon;
GRANT SELECT ON fields TO anon; 