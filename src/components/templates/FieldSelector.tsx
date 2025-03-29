import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Position {
  x: number;
  y: number;
  page: number;
  fieldId: string;
}

interface FieldSelectorProps {
  fields: Field[];
  selectedField: Field | null;
  positions: Position[];
  onFieldSelect: (field: Field) => void;
}

export const FieldSelector = ({
  fields,
  selectedField,
  positions,
  onFieldSelect,
}: FieldSelectorProps) => {
  const getFieldPositionsCount = (fieldId: string) => {
    return positions.filter((pos) => pos.fieldId === fieldId).length;
  };

  return (
    <div className="sticky top-4">
      <Card className="shadow-lg">
        <CardHeader className="sticky top-0 py-6 bg-background z-10 border-b">
          <CardTitle className="text-lg font-bold">Form Fields</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-4 space-y-2">
              {fields.map((field) => {
                const positionsCount = getFieldPositionsCount(field.id);
                const isSelected = selectedField?.id === field.id;

                return (
                  <div
                    key={field.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onFieldSelect(field)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{field.name}</div>
                        <div className="text-sm text-gray-500">{field.type}</div>
                      </div>
                      {positionsCount > 0 && (
                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {positionsCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {fields.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No fields available
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}; 