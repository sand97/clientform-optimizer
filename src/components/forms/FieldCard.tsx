
import { Field as FieldType } from '@/types/forms';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Info } from 'lucide-react';
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
    <Card className="bg-white border shadow-sm hover:shadow transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
              {index + 1}
            </span>
            <h3 className="font-medium text-lg">{field.name || 'Unnamed Field'}</h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(field.id)}
            className="text-gray-500 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Type:</span>
            <Badge variant="outline" className="bg-gray-100">
              {fieldTypeLabel}
            </Badge>
          </div>
          
          {field.placeholder && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Placeholder:</span>
              <span className="text-gray-700">{field.placeholder}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Required:</span>
            <Badge variant={field.required ? "default" : "outline"} className={field.required ? "bg-red-100 text-red-600 border-red-200" : "bg-gray-100"}>
              {field.required ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FieldCard;
