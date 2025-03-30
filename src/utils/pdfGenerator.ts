
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
    for (const field of fields) {
      try {
        // Check if the page exists
        if (field.position.page >= pages.length) {
          console.warn(`Page ${field.position.page} does not exist for field ${field.id}.`);
          continue;
        }
        
        const page = pages[field.position.page];
        const { width, height } = page.getSize();
        
        // Convert percentage-based coordinates to absolute values if needed
        let xPos = field.position.x;
        let yPos = field.position.y;
        
        // If x and y are percentages (0-100 range), convert to absolute coordinates
        if (xPos <= 100 && xPos >= 0) {
          xPos = (xPos / 100) * width;
        }
        
        if (yPos <= 100 && yPos >= 0) {
          yPos = height - ((yPos / 100) * height); // Convert from top-left to bottom-left origin
        } else {
          yPos = height - yPos; // Convert from top-left to bottom-left origin
        }
        
        // Debug logs
        console.log(`Drawing field ${field.id} with value "${field.value}" at position (${xPos}, ${yPos}) on page ${field.position.page}`);
        
        // Add text to the correct position
        page.drawText(String(field.value), {
          x: xPos,
          y: yPos,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
      } catch (err) {
        console.error(`Error drawing field ${field.id}:`, err);
      }
    }
    
    // Step 5: Save the filled PDF
    return await pdfDoc.save();
    
  } catch (error) {
    console.error('Error generating filled PDF:', error);
    throw error;
  }
}
