
import { Field as FieldType } from '@/types/forms';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { FIELD_TYPES } from '@/constants/formFields';

interface FieldCardProps {
  field: FieldType;
  onRemove: (id: string) => void;
  index: number;
}

const FieldCard = ({ field, onRemove, index }: FieldCardProps) => {
  const fieldTypeLabel = FIELD_TYPES.find(t => t.value === field.type)?.label || field.type;
  
  return (
    <Card className="bg-white border shadow-sm hover:shadow transition-shadow duration-200">
      <div className="flex justify-between items-start p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
              {index + 1}
            </span>
            <h3 className="font-medium text-lg">{field.name}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-gray-100">
              {fieldTypeLabel}
            </Badge>
            {field.required && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                Required
              </Badge>
            )}
            {field.placeholder && (
              <Badge variant="outline" className="bg-gray-50">
                Placeholder: {field.placeholder}
              </Badge>
            )}
          </div>
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
    </Card>
  );
};

export default FieldCard;
