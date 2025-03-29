import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FIELD_TYPES } from '@/constants/formFields';
import { Field } from '@/types/forms';
import { Info, Trash2 } from 'lucide-react';

interface FieldListProps {
  fields: Field[];
  onFieldUpdate: (updatedFields: Field[]) => void;
  onFieldDelete: (id: string) => void;
}

const FieldList = ({ fields, onFieldUpdate, onFieldDelete }: FieldListProps) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <Card key={field.id} className="bg-white shadow-sm">
          <CardContent className="p-3">
            <div className="flex w-full items-center justify-between pb-3">
              <div className="flex items-center space-x-4">
                <Select 
                  defaultValue={field.type}
                  onValueChange={(value) => {
                    const updatedFields = fields.map(f => 
                      f.id === field.id 
                        ? { ...f, type: value, options: value === 'dropdown' || value === 'checkbox' ? '' : undefined }
                        : f
                    );
                    onFieldUpdate(updatedFields);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        Field {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium">Required</span>
                  <Checkbox 
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) => {
                      const updatedFields = fields.map(f => 
                        f.id === field.id 
                          ? { ...f, required: checked as boolean }
                          : f
                      );
                      onFieldUpdate(updatedFields);
                    }}
                  />
                </div>
                <div className="flex-grow"></div>
              </div>
              <Button 
                disabled={fields.length === 1}
                type="button" 
                className='mr-8'
                variant="destructive" 
                onClick={() => onFieldDelete(field.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Field
              </Button>
            </div>
            
            <div className="flex items-center justify-between pb-3 space-x-2">
              <div className="w-full">
                <Input 
                  className="w-full text-lg" 
                  placeholder="Field name" 
                  value={field.name}
                  onChange={(e) => {
                    const updatedFields = fields.map(f => 
                      f.id === field.id 
                        ? { ...f, name: e.target.value }
                        : f
                    );
                    onFieldUpdate(updatedFields);
                  }}
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-6 w-6 rounded-full flex items-center justify-center">
                      <Info className="h-4 w-4 text-gray-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white">
                    <p>Enter a descriptive name for this field</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center justify-between pb-3 space-x-2">
              <div className="w-full">
                <Input 
                  className="w-full text-lg" 
                  placeholder="Field placeholder" 
                  value={field.placeholder || ''}
                  onChange={(e) => {
                    const updatedFields = fields.map(f => 
                      f.id === field.id 
                        ? { ...f, placeholder: e.target.value }
                        : f
                    );
                    onFieldUpdate(updatedFields);
                  }}
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-6 w-6 rounded-full flex items-center justify-center">
                      <Info className="h-4 w-4 text-gray-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white">
                    <p>Text that will appear inside the empty field</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {(field.type === 'dropdown' || field.type === 'checkbox') && (
              <div className="flex items-center justify-between pb-3 space-x-2">
                <div className="w-full">
                  <Input 
                    className="w-full text-lg" 
                    placeholder="Comma separated values, e.g Cat,Dog..." 
                    value={field.options || ''} 
                    onChange={(e) => {
                      const updatedFields = fields.map(f => 
                        f.id === field.id 
                          ? { ...f, options: e.target.value }
                          : f
                      );
                      onFieldUpdate(updatedFields);
                    }}
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-6 w-6 rounded-full flex items-center justify-center">
                        <Info className="h-4 w-4 text-gray-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white">
                      <p>Enter options separated by commas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FieldList; 