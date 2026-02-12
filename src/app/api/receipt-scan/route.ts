export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Simple receipt parsing - extracts numbers and dates from image
// In production, replace with Google Cloud Vision, AWS Textract, or OpenAI Vision

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const receiptFile = formData.get('receipt') as File;

    if (!receiptFile) {
      return NextResponse.json({ error: 'No receipt image provided' }, { status: 400 });
    }

    // Convert to base64 for potential API calls
    const bytes = await receiptFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // TODO: In production, call an OCR service here
    // For now, return a placeholder response that indicates manual entry is needed
    // You can integrate with:
    // - Google Cloud Vision API
    // - AWS Textract
    // - OpenAI GPT-4 Vision
    // - Tesseract.js (client-side)

    // Simulated response - in production this would come from OCR
    // For now, we'll return null values to indicate the user should enter manually
    // but keep the image for attachment
    
    const extractedData = {
      cost: undefined as number | undefined,
      date: undefined as string | undefined,
      vendor: undefined as string | undefined,
      description: 'Receipt scan',
      confidence: 0.5, // Low confidence since this is a placeholder
      message: 'Receipt captured. Please verify or enter the details manually.',
    };

    // In a real implementation, you would:
    // 1. Send the image to an OCR service
    // 2. Parse the response to find:
    //    - Total amount (look for "Total", "Amount Due", currency symbols)
    //    - Date (various formats)
    //    - Vendor name (usually at top of receipt)
    // 3. Return the extracted data with confidence scores

    return NextResponse.json(extractedData);

  } catch (error) {
    console.error('Receipt scan error:', error);
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
  }
}
