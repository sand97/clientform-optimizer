
import { Field as FieldType } from '@/types/forms';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Info, Check, ArrowDown } from 'lucide-react';
import { FIELD_TYPES } from '@/constants/formFields';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FieldCardProps {
  field: FieldType;
  onRemove: (id: string) => void;
  index: number;
}

const FieldCard = ({ field, onRemove, index }: FieldCardProps) => {
  const fieldTypeLabel = FIELD_TYPES.find(t => t.value === field.type)?.label || field.type;
  
  return (
    <Card className="bg-white border rounded-xl overflow-hidden shadow-sm relative">
      {/* Field Type and Required Row - combined into one row */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium">Field {fieldTypeLabel}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-base font-medium">Requis</span>
          <div className={`h-6 w-6 rounded-md border ${field.required ? 'bg-primary border-primary' : 'bg-transparent border-gray-300'} flex items-center justify-center`}>
            {field.required && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      </div>
      
      {/* Field Name Row */}
      <div className="flex items-center justify-between p-4 border-b">
        <input 
          type="text" 
          value={field.name || ''} 
          readOnly
          placeholder="Field name" 
          className="w-full text-lg bg-transparent outline-none" 
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-6 w-6 rounded-full border border-gray-400 flex items-center justify-center">
                <Info className="h-4 w-4 text-gray-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-white">
              <p>Enter a descriptive name for this field</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Placeholder Row */}
      <div className="flex items-center justify-between p-4">
        <input 
          type="text" 
          value={field.placeholder || ''} 
          readOnly
          placeholder="Field placeholder" 
          className="w-full text-lg bg-transparent outline-none" 
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-6 w-6 rounded-full border border-gray-400 flex items-center justify-center">
                <Info className="h-4 w-4 text-gray-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-white">
              <p>Text that will appear inside the empty field</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Delete Button */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemove(field.id)}
        className="absolute top-0 right-0 m-2"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete field</span>
      </Button>
    </Card>
  );
};

export default FieldCard;
