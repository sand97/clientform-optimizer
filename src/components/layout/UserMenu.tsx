
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogOut, MessageSquare, User, Settings } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface UserMenuProps {
  userName: string;
  organizations: Organization[];
  currentOrganization?: Organization | null;
  onSelectOrganization: (id: string) => void;
}

const UserMenu = ({ 
  userName, 
  organizations, 
  currentOrganization, 
  onSelectOrganization 
}: UserMenuProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleContactUs = () => {
    // This could be updated to open a contact form or navigate to a contact page
    window.open('mailto:support@formfiller.com', '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Organization Selector Popover */}
      <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-1 max-w-[200px] sm:max-w-[300px]"
          >
            <span className="truncate">
              {currentOrganization?.name || 'Select Organization'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-2" align="start">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground px-2 py-1.5">
              Your Organizations
            </h4>
            <div className="max-h-[300px] overflow-auto">
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    currentOrganization?.id === org.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => {
                    onSelectOrganization(org.id);
                    setIsOrgPopoverOpen(false);
                  }}
                >
                  <span className="truncate">{org.name}</span>
                </Button>
              ))}
            </div>
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  navigate('/organizations/create');
                  setIsOrgPopoverOpen(false);
                }}
              >
                Create New Organization
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* User Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="max-w-[100px] truncate hidden sm:inline">
              {userName || 'Account'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/account/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleContactUs}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Us
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
