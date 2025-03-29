
import { useState } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrganization?: Organization | null;
  onSelectOrganization: (id: string) => void;
  onCreate: () => void;
}

const OrganizationSelector = ({ 
  organizations, 
  currentOrganization, 
  onSelectOrganization,
  onCreate
}: OrganizationSelectorProps) => {
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = useState(false);

  return (
    <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-1 max-w-[300px]"
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
                onCreate();
                setIsOrgPopoverOpen(false);
              }}
            >
              Create New Organization
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrganizationSelector;
