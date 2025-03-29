import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Mail, Trash2, ArrowLeft, UserPlus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member';
  user: {
    email: string;
    user_metadata: {
      full_name?: string;
      name?: string;
    };
  };
  created_at: string;
}

interface User {
  id: string;
  email: string;
  organization_id: string;
  user_metadata: {
    full_name?: string;
    name?: string;
  };
}

type OrganizationMemberWithUser = Database['public']['Views']['organization_members_with_users']['Row'];

const TeamMembers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationMemberWithUser | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user) return;

      try {
        // First, get the user's current organization
        const { data: orgData, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (orgError) throw orgError;

        // Then fetch organization members with their profiles in a single query
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members_with_users')
          .select('*')
          .eq('organization_id', orgData.organization_id);

        if (membersError) throw membersError;

        // Transform the data to match our TeamMember interface
        const transformedMembers = (membersData as OrganizationMemberWithUser[]).map(member => ({
          ...member,
          user: {
            email: member.email,
            user_metadata: member.user_metadata
          },
          role: member.role as 'owner' | 'admin' | 'member'
        })) as TeamMember[];
        
        setMembers(transformedMembers);
        setCurrentOrganization(transformedMembers[0] || null);
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user, toast]);

  const refreshMembers = async (organizationId: string) => {
    const { data: updatedMembers, error: refreshError } = await supabase
      .from('organization_members_with_users')
      .select('*')
      .eq('organization_id', organizationId);

    if (refreshError) throw refreshError;

    const transformedMembers = (updatedMembers as OrganizationMemberWithUser[]).map(member => ({
      ...member,
      user: {
        email: member.email,
        user_metadata: member.user_metadata
      },
      role: member.role as 'owner' | 'admin' | 'member'
    })) as TeamMember[];
    
    setMembers(transformedMembers);
    setCurrentOrganization(transformedMembers[0] || null);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Coming Soon",
      description: "This feature will be implemented securely in the next update. Stay tuned!",
    });
    return;
    setInviting(true);
    try {
      // Check if user exists using the view
      const { data: existingUser, error: userError } = await supabase
        .from('organization_members_with_users')
        .select('user_id')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // Check if user is already a member
      if (existingUser) {
        const { data: existingMember, error: memberError } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', currentOrganization?.organization_id)
          .eq('user_id', existingUser.user_id)
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError;
        }

        if (existingMember) {
          toast({
            title: "Error",
            description: "This user is already a member of your organization",
            variant: "destructive",
          });
          return;
        }
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert([
          {
            organization_id: currentOrganization?.organization_id,
            email,
            role,
            invited_by: user?.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          },
        ])
        .select()
        .single();

      if (inviteError) throw inviteError;

      toast({
        title: "Invitation sent",
        description: "An invitation has been sent to the specified email address",
      });

      setEmail('');
      setRole('member');
      setShowInviteDialog(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user) return;

    try {
      // First, get the user's current organization
      const { data: orgData, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError) throw orgError;

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', orgData.organization_id);

      if (error) throw error;

      // Refresh members list
      await refreshMembers(orgData.organization_id);

      toast({
        title: "Member removed",
        description: "The team member has been removed from your organization",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const getMemberName = (member: TeamMember) => {
    const metadata = member.user.user_metadata;
    return metadata?.full_name || metadata?.name || member.user.email.split('@')[0];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Team Members</CardTitle>
            <CardDescription>
              Manage your organization's team members and their roles
            </CardDescription>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading team members...</p>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No team members yet</p>
              <Button onClick={() => setShowInviteDialog(true)} className="mt-4">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Your First Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{getMemberName(member)}</TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMembers; 