import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamMember, Organization } from '@/types/forms';

// UI Components
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, UserPlus2, X, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import OrganizationSelector from '@/components/layout/OrganizationSelector';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

const TeamMembers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationId } = useParams<{ organizationId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // Load organizations and set current one
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            organization_id,
            organizations:organization_id(id, name, created_at)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // Filter out any null values before mapping
        const orgs = data
          .filter(item => item.organizations)
          .map(item => item.organizations) as Organization[];
          
        setOrganizations(orgs);
        
        // If organizationId is provided in URL, use that, otherwise use first org
        if (organizationId && orgs.length > 0) {
          const selectedOrg = orgs.find(org => org.id === organizationId);
          if (selectedOrg) {
            setCurrentOrganization(selectedOrg);
          } else {
            // Redirect to first org if specified org not found
            navigate(`/team/${orgs[0].id}`);
          }
        } else if (orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
          navigate(`/team/${orgs[0].id}`);
        }
      } catch (error: any) {
        toast({
          title: "Error loading organizations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [user, navigate, organizationId, toast]);

  // Load team members for the current organization
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentOrganization) return;

      try {
        setIsLoading(true);
        
        // Get current user's role
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', currentOrganization.id)
          .eq('user_id', user?.id || '')
          .single();
        
        if (userRoleError) throw userRoleError;
        
        setIsCurrentUserAdmin(
          userRoleData?.role === 'admin' || 
          userRoleData?.role === 'owner'
        );
        
        // Get all members - using the view directly without an intermediary function
        const { data, error } = await supabase
          .from('organization_members_with_users')
          .select('*')
          .eq('organization_id', currentOrganization.id);

        if (error) throw error;

        console.log('Members data:', data);

        // Map the results to match TeamMember type
        setMembers(data as TeamMember[]);
      } catch (error: any) {
        console.error('Error fetching members:', error);
        toast({
          title: "Error loading team members",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [currentOrganization, user, toast]);

  const handleSelectOrganization = (id: string) => {
    navigate(`/team/${id}`);
  };

  const handleCreateOrganization = () => {
    navigate('/organizations/create');
  };

  // Invite form schema
  const inviteFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    role: z.enum(["member", "admin"], {
      required_error: "Please select a role",
    }),
  });

  const inviteForm = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onInviteSubmit = async (values: z.infer<typeof inviteFormSchema>) => {
    if (!currentOrganization || !user) return;

    try {
      // Check if the user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('email', values.email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingMember) {
        toast({
          title: "User already a member",
          description: "This user is already a member of this organization.",
          variant: "destructive",
        });
        return;
      }

      // Check if there's already a pending invitation
      const { data: existingInvite, error: inviteCheckError } = await supabase
        .from('invitations')
        .select('id, status')
        .eq('organization_id', currentOrganization.id)
        .eq('email', values.email)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteCheckError) throw inviteCheckError;

      if (existingInvite) {
        toast({
          title: "Invitation already sent",
          description: "There is already a pending invitation for this email.",
          variant: "destructive",
        });
        return;
      }

      // Create invitation
      const { error: createError } = await supabase
        .from('invitations')
        .insert({
          organization_id: currentOrganization.id,
          email: values.email,
          role: values.role,
          invited_by: user.id,
        });

      if (createError) throw createError;

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${values.email}.`,
      });

      setIsInviteModalOpen(false);
      inviteForm.reset();
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !currentOrganization) return;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberToRemove.id)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      setMembers(members.filter(member => member.id !== memberToRemove.id));
      toast({
        title: "Member removed",
        description: "The team member has been removed from the organization.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const confirmRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setIsRemoveDialogOpen(true);
  };

  // Get the user's first and last name from raw_user_meta_data
  const getUserName = (member: TeamMember): string => {
    if (!member.raw_user_meta_data) return '';
    
    const firstName = member.raw_user_meta_data.first_name || 
                     member.raw_user_meta_data.given_name || 
                     member.raw_user_meta_data.name?.split(' ')[0] || '';
                     
    const lastName = member.raw_user_meta_data.last_name || 
                    member.raw_user_meta_data.family_name || 
                    (member.raw_user_meta_data.name?.split(' ').slice(1).join(' ') || '');
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    // If no name found, use the first part of the email
    return member.email.split('@')[0];
  };

  // Get initials for avatar
  const getInitials = (member: TeamMember): string => {
    const name = getUserName(member);
    if (!name) return member.email.substring(0, 2).toUpperCase();
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {organizations.length > 0 && (
            <OrganizationSelector
              organizations={organizations}
              currentOrganization={currentOrganization}
              onSelectOrganization={handleSelectOrganization}
              onCreate={handleCreateOrganization}
            />
          )}
        </div>
        
        {isCurrentUserAdmin && (
          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus2 className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={inviteForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="member">Team Member</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Administrators can manage team members and organization settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Send Invitation</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <PageHeader 
        heading={currentOrganization ? `${currentOrganization.name} Team` : "Team Members"} 
        text="Manage your organization's team members and permissions."
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            People who have access to this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No team members found.</p>
              {isCurrentUserAdmin && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <UserPlus2 className="mr-2 h-4 w-4" />
                  Invite Your First Team Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {isCurrentUserAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(member)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{getUserName(member)}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="capitalize">{member.role}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span>Active</span>
                      </div>
                    </TableCell>
                    {isCurrentUserAdmin && (
                      <TableCell>
                        {member.user_id !== user?.id && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => confirmRemoveMember(member)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                {members.length} team {members.length === 1 ? 'member' : 'members'} in total.
              </TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Member Removal Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member from your organization?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamMembers;
