-- Enable RLS on organizations table if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they have pending invitations for" ON organizations;

-- Create a function to check if a user has a pending invitation
CREATE OR REPLACE FUNCTION has_pending_invitation(user_id uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM invitations
    WHERE organization_id = org_id
    AND email = (SELECT email FROM auth.users WHERE id = user_id)
    AND status = 'pending'
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to allow users to view organizations they are members of
CREATE POLICY "Users can view organizations they are members of"
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
  )
);

-- Policy to allow users to view organizations they have pending invitations for
CREATE POLICY "Users can view organizations they have pending invitations for"
ON organizations
FOR SELECT
TO authenticated
USING (
  has_pending_invitation(auth.uid(), organizations.id)
);

-- Enable RLS on invitations table if not already enabled
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON invitations;
DROP POLICY IF EXISTS "Organization members can create invitations" ON invitations;
DROP POLICY IF EXISTS "Organization members can view invitations" ON invitations;

-- Policy to allow users to view their own invitations
CREATE POLICY "Users can view their own invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
  AND expires_at > NOW()
);

-- Policy to allow users to update their own invitations (for declining)
CREATE POLICY "Users can update their own invitations"
ON invitations
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'expired'
);

-- Policy to allow organization members to create invitations
CREATE POLICY "Organization members can create invitations"
ON invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = invitations.organization_id
    AND user_id = auth.uid()
  )
);

-- Policy to allow organization members to view invitations for their organization
CREATE POLICY "Organization members can view invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = invitations.organization_id
    AND user_id = auth.uid()
  )
); 