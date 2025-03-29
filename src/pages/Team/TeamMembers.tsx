
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

const TeamMembers = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
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

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        
        // Query the organization_members table directly (not the view)
        const { data, error } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', organizationId);
          
        if (error) throw error;
        
        // Transform the data to match our TeamMember type
        const transformedMembers: TeamMember[] = data.map(member => ({
          id: member.id || '',
          organization_id: member.organization_id || '',
          user_id: member.user_id || '',
          role: member.role || '',
          created_at: member.created_at || '',
          email: member.user_id || '', // Use user_id as email placeholder
          raw_user_meta_data: null
        }));

        setMembers(transformedMembers);
        
        // Check if current user is admin
        const memberRecord = transformedMembers.find(m => m.user_id === user?.id);
        if (memberRecord && ['owner', 'admin'].includes(memberRecord.role)) {
          setIsAdmin(true);
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
    
    fetchMembers();
  }, [organizationId, user, toast]);

  const handleInvite = async () => {
    if (!organizationId || !inviteEmail || !inviteRole) return;

    try {
      const { error } = await supabase.functions.invoke('invite-to-organization', {
        body: {
          email: inviteEmail,
          organization_id: organizationId,
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
    if (!organizationId) return;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
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
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/join/${organizationId}`;
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
            <ul className="divide-y divide-gray-200">
              {members.map((member) => (
                <li key={member.user_id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${member.user_id}.png`} />
                      <AvatarFallback>{member.user_id.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getDisplayName(member)}</p>
                      <p className="text-gray-500 text-sm">{member.user_id}</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {member.role}
                    </span>
                    {isAdmin && member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleRemove(member.user_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMembers;
