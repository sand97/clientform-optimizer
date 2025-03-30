
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember } from '@/types/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, Copy, Plus, UserPlus, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TeamMembers = () => {
  const { organizationId } = useParams<{ organizationId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [copied, setCopied] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<{id: string, name: string}[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string, surname: string, email: string } | null>(null);

  // Fetch user's organizations if no organizationId is provided
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Get organization details
          const orgIds = data.map(item => item.organization_id);
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', orgIds);
            
          if (orgsError) throw orgsError;
          
          setUserOrganizations(orgsData || []);
          
          // If no organizationId was provided in the URL, use the first one
          if (!organizationId && orgsData && orgsData.length > 0) {
            setSelectedOrganizationId(orgsData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching user organizations:', error);
      }
    };
    
    if (!organizationId) {
      fetchUserOrganizations();
    } else {
      setSelectedOrganizationId(organizationId);
    }
  }, [user, organizationId]);

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedOrganizationId) return;
      
      try {
        setLoading(true);
        
        // Query the organization_members_with_users view to get member details
        const { data, error } = await supabase
          .from('organization_members_with_users')
          .select('*')
          .eq('organization_id', selectedOrganizationId);
          
        if (error) throw error;

        setMembers(data || []);
        
        // Check if current user is admin
        const memberRecord = data?.find(m => m.user_id === user?.id);
        if (memberRecord && ['owner', 'admin'].includes(memberRecord.role)) {
          setIsAdmin(true);
        }

        // Fetch current user's profile
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, surname')
            .eq('id', user.id)
            .single();
            
          if (!profileError && profileData) {
            setUserProfile({
              name: profileData.name || '',
              surname: profileData.surname || '',
              email: user.email || '',
            });
          }
        }
      } catch (error: any) {
        console.error('Error loading members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedOrganizationId) {
      fetchMembers();
    }
  }, [selectedOrganizationId, user, toast]);

  const handleInvite = async () => {
    if (!selectedOrganizationId || !inviteEmail || !inviteRole) return;

    try {
      const { error } = await supabase.functions.invoke('invite-to-organization', {
        body: {
          email: inviteEmail,
          organization_id: selectedOrganizationId,
          role: inviteRole,
        },
      });

      if (error) {
        console.error('Error inviting member:', error);
        toast({
          title: "Error",
          description: "Failed to invite member",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to invite member",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!selectedOrganizationId) return;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', selectedOrganizationId)
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      setMembers(members.filter(member => member.user_id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (!selectedOrganizationId) return;
    
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/join/${selectedOrganizationId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Success",
      description: "URL copied to clipboard",
    });
  };

  // Get display name from user ID - simplified version
  const getDisplayName = (member: TeamMember) => {
    // Just display the first 8 characters of the user ID as a placeholder
    // Since we don't have access to the user's name directly
    return `User ${member.user_id.substring(0, 8)}...`;
  };

  // If no organization is selected yet and we're loading orgs, show loading
  if (!selectedOrganizationId && userOrganizations.length === 0) {
    return <p>Loading organizations...</p>;
  }

  // If we have organizations but none selected, show a selector
  if (!selectedOrganizationId && userOrganizations.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Select an Organization</CardTitle>
            <CardDescription>
              Please select an organization to view team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userOrganizations.map(org => (
                <Button 
                  key={org.id} 
                  variant="outline" 
                  className="w-full text-left justify-start h-auto py-3"
                  onClick={() => navigate(`/team/${org.id}`)}
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">View team members</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <p>Loading team members...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their roles within the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Current Members</h3>
              <p className="text-sm text-gray-500">
                {members.length} members
              </p>
            </div>
            {isAdmin && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy Invite Link
                </Button>
                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Invite New Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to a new team member.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="col-span-3"
                          type="email"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" onClick={handleInvite}>
                      Send Invitation
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          
          {members.length === 0 ? (
            <div className="text-center text-gray-500">
              No members found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${member.user_id}.png`} />
                          <AvatarFallback>
                            {member.name && member.surname
                              ? `${member.name.charAt(0)}${member.surname.charAt(0)}`
                              : member.user_id.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          {member.name && member.surname 
                            ? `${member.name} ${member.surname}`
                            : `User ${member.user_id.substring(0, 8)}...`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.user_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {userProfile && (
          <CardFooter className="border-t pt-6 flex flex-col items-start">
            <h4 className="text-sm font-semibold mb-2">Your Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-sm">
              <div>
                <span className="text-gray-500 block">Name</span>
                <span>{userProfile.name} {userProfile.surname}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500 block">Email</span>
                <span>{userProfile.email}</span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default TeamMembers;
