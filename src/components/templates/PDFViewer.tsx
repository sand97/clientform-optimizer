import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent } from '@/components/ui/card';
import { FieldMarker } from './FieldMarker';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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
}

interface PDFViewerProps {
  file: File;
  selectedField: Field | null;
  positions: Position[];
  onPositionAdd: (position: Omit<Position, 'id'>) => void;
  onPositionRemove: (position: Position) => void;
  onPositionUpdate: (oldPosition: Position, newPosition: Position) => void;
  fields: Field[];
}

export const PDFViewer = ({ 
  file, 
  selectedField, 
  positions, 
  onPositionAdd, 
  onPositionRemove,
  onPositionUpdate,
  fields 
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>({});
  const [fileUrl, setFileUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    if (!selectedField || !pageRefs.current[pageNumber]) return;

    const page = pageRefs.current[pageNumber].current;
    if (!page) return;

    const rect = page.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    onPositionAdd({
      x,
      y,
      page: pageNumber,
      fieldId: selectedField.id,
    });
  };

  const handlePositionChange = (updatedPosition: Position) => {
    // Find the position to update by matching id
    const existingPosition = positions.find(pos => pos.id === updatedPosition.id);

    if (existingPosition) {
      onPositionUpdate(existingPosition, updatedPosition);
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
  };

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardContent className="p-6">
        <div 
          ref={containerRef}
          className={`relative ${selectedField ? 'cursor-crosshair' : ''}`}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              // Initialize refs for each page
              for (let i = 1; i <= numPages; i++) {
                pageRefs.current[i] = React.createRef<HTMLDivElement>();
              }
            }}
            onLoadError={onDocumentLoadError}
            className="pdf-document"
          >
            {Array.from(new Array(numPages), (_, index) => {
              const pageNumber = index + 1;
              if (!pageRefs.current[pageNumber]) {
                pageRefs.current[pageNumber] = React.createRef<HTMLDivElement>();
              }
              return (
                <div 
                  key={`page_${pageNumber}`} 
                  ref={pageRefs.current[pageNumber]}
                  className="relative mb-4" 
                  onClick={(e) => handleClick(e, pageNumber)}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                  />
                  {positions
                    .filter((pos) => pos.page === pageNumber)
                    .map((pos, i) => (
                      <FieldMarker
                        key={`marker_${i}`}
                        field={fields.find(f => f.id === pos.fieldId)}
                        position={pos}
                        pageRef={pageRefs.current[pageNumber]}
                        onPositionChange={handlePositionChange}
                        onPositionRemove={onPositionRemove}
                      />
                    ))}
                </div>
              );
            })}
          </Document>
        </div>
      </CardContent>
    </Card>
  );
}; 