import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload } from 'lucide-react';
import { FormSelector } from '@/components/templates/FormSelector';
import { PDFViewer } from '@/components/templates/PDFViewer';
import { FieldSelector } from '@/components/templates/FieldSelector';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Form {
  id: string;
  name: string;
  fields: Field[];
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

const CreateTemplate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleFormSelect = (form: Form | null) => {
    setSelectedForm(form);
  };

  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
  };

  const handlePositionAdd = (position: Omit<Position, 'id'>) => {
    const newPosition = {
      ...position,
      id: uuidv4()
    };
    setPositions([...positions, newPosition]);
  };

  const handlePositionRemove = (positionToRemove: Position) => {
    setPositions(positions.filter(pos => pos.id !== positionToRemove.id));
  };

  const handlePositionUpdate = (oldPosition: Position, newPosition: Position) => {
    setPositions(positions.map(pos => 
      pos.id === oldPosition.id ? { ...newPosition, id: pos.id } : pos
    ));
  };

  const handleNext = () => {
    if (step === 1 && selectedForm && selectedFile) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate('/templates');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedForm || !user) return;

    try {
      // Upload PDF to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

      // Create template record
      const { error: templateError } = await supabase
        .from('templates')
        .insert({
          form_id: selectedForm.id,
          pdf_url: publicUrl,
          positions: JSON.stringify(positions),
          user_id: user.id,
          original_pdf_name: selectedFile.name
        });

      if (templateError) throw templateError;

      toast({
        title: "Success",
        description: "Template saved successfully",
      });

      navigate('/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {step === 1 ? 'Back to Templates' : 'Back to Form Selection'}
      </Button>

      {step === 1 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="pdf">PDF Template</Label>
                  <div className="relative mt-1">
                    <Input
                      ref={fileInputRef}
                      id="pdf"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div 
                      className="border rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={handleUploadClick}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Click to upload PDF file'}
                      </div>
                    </div>
                  </div>
                </div>
                <FormSelector onFormSelect={handleFormSelect} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={!selectedForm || !selectedFile}
            >
              Next: Map Fields
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FieldSelector
              fields={selectedForm?.fields || []}
              selectedField={selectedField}
              positions={positions}
              onFieldSelect={handleFieldSelect}
            />
          </div>
          <div className="md:col-span-3">
            {selectedFile && (
              <>
                <PDFViewer
                  file={selectedFile}
                  selectedField={selectedField}
                  positions={positions}
                  onPositionAdd={handlePositionAdd}
                  onPositionRemove={handlePositionRemove}
                  onPositionUpdate={handlePositionUpdate}
                  fields={selectedForm?.fields || []}
                />
                <div className="py-4 flex justify-end">
                  <Button onClick={handleSubmit}>
                    Save Template
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTemplate; 