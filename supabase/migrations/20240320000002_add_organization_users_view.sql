-- Create a function to check organization membership
CREATE OR REPLACE FUNCTION is_organization_member_view(user_id uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION is_organization_member_view TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view members of their organization" ON organization_members;

-- Drop the existing view if it exists
DROP VIEW IF EXISTS organization_members_with_users;

-- Create a simple view that combines organization members with user information
CREATE VIEW organization_members_with_users AS
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.created_at,
  au.email::text,
  au.raw_user_meta_data
FROM organization_members om
JOIN auth.users au ON om.user_id = au.id;

-- Enable RLS on organization_members table
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view members of their organization
CREATE POLICY "Users can view members of their organization"
ON organization_members
FOR SELECT
TO authenticated
USING (
  is_organization_member_view(auth.uid(), organization_id)
  OR user_id = auth.uid()
);

-- Grant access to the view
GRANT SELECT ON organization_members_with_users TO authenticated; 