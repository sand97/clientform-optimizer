-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view members of their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Organization members can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON invitations;

-- Enable RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view members of their organization
CREATE POLICY "Users can view members of their organization"
ON organization_members
FOR SELECT
TO authenticated
USING (
  is_organization_member_view(auth.uid(), organization_id)
);

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.email::text = invitations.email::text
  )
  AND status = 'pending'
  AND expires_at > NOW()
);

-- Policy to allow organization members to create invitations
CREATE POLICY "Organization members can create invitations"
ON invitations
FOR INSERT
TO authenticated
WITH CHECK (
  is_organization_member_view(auth.uid(), organization_id)
);

-- Policy to allow users to update their own invitations (for declining)
CREATE POLICY "Users can update their own invitations"
ON invitations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.email::text = invitations.email::text
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.email::text = invitations.email::text
  )
  AND status = 'expired'
); 