import { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Position {
  id: string;
  x: number;
  y: number;
  page: number;
  fieldId: string;
  pageWidth: number;
  pageHeight: number;
}

interface FieldMarkerProps {
  field: Field | undefined;
  position: Position;
  pageRef: React.RefObject<HTMLDivElement>;
  onPositionChange: (position: Position) => void;
  onPositionRemove: (position: Position) => void;
}

export const FieldMarker = ({
  field,
  position,
  pageRef,
  onPositionChange,
  onPositionRemove,
}: FieldMarkerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);
  const currentPosition = useRef(position);

  const updatePosition = (e: React.DragEvent) => {
    if (!pageRef.current) return;

    const page = pageRef.current;
    const rect = page.getBoundingClientRect();
    
    // Calculate position as percentage of page dimensions
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Ensure the position stays within bounds
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    currentPosition.current = {
      ...position,
      x: boundedX,
      y: boundedY,
      pageWidth: rect.width,
      pageHeight: rect.height
    };

    onPositionChange(currentPosition.current);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!markerRef.current || !pageRef.current) return;
    e.stopPropagation();
    setIsDragging(true);
    
    // Create a transparent drag image to prevent ghost element
    const img = new Image();
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // Ensure we update with the final position
    updatePosition(e);
  };

  return (
    <div
      ref={markerRef}
      className={`absolute z-10 cursor-move ${isDragging ? 'opacity-50' : ''}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onClick={(e) => e.stopPropagation()}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <div className="flex items-center bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg select-none">
        <span className="mr-2">{field?.name || position.fieldId}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPositionRemove(position);
          }}
          className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}; 