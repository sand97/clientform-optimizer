
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PDFField {
  id: string;
  value: string;
  position: {
    x: number;
    y: number;
    page: number;
  };
}

export async function generateFilledPDF(
  pdfUrl: string,
  fields: PDFField[]
): Promise<Uint8Array> {
  try {
    // Step 1: Download the PDF template
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF template');
    }
    const pdfBytes = await pdfResponse.arrayBuffer();
    
    // Step 2: Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Step 3: Prepare font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Step 4: Fill the form fields based on positions
    fields.forEach(field => {
      try {
        // Check if the page exists
        if (field.position.page >= pages.length) {
          console.warn(`Page ${field.position.page} does not exist for field ${field.id}.`);
          return;
        }
        
        const page = pages[field.position.page];
        const { width, height } = page.getSize();
        
        // Add text to the correct position
        page.drawText(field.value, {
          x: field.position.x,
          y: height - field.position.y, // Convert from top-left to bottom-left origin
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
      } catch (err) {
        console.error(`Error drawing field ${field.id}:`, err);
      }
    });
    
    // Step 5: Save the filled PDF
    return await pdfDoc.save();
    
  } catch (error) {
    console.error('Error generating filled PDF:', error);
    throw error;
  }
}
