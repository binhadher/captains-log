/**
 * Unified sharing utilities for Captain's Log
 * Handles sharing with text + files (photos/documents) consistently
 */

export interface ShareOptions {
  title: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/webm': '.webm',
    'audio/mpeg': '.mp3',
  };
  return mimeToExt[mimeType] || '';
}

/**
 * Ensure filename has proper extension based on file type
 */
function ensureFileExtension(fileName: string, fileType?: string): string {
  if (!fileType) return fileName;
  
  const ext = getExtensionFromMimeType(fileType);
  if (!ext) return fileName;
  
  // Check if fileName already has the correct extension
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(ext) || lowerName.endsWith(ext.replace('.', ''))) {
    return fileName;
  }
  
  // Check if it has any extension
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot > 0) {
    // Has an extension, might be wrong - replace it
    return fileName.substring(0, lastDot) + ext;
  }
  
  // No extension - add one
  return fileName + ext;
}

/**
 * Share content with optional file attachment
 * Falls back to text-only or clipboard copy if file sharing isn't supported
 */
export async function shareContent(options: ShareOptions): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'download' }> {
  const { title, text, fileUrl, fileName, fileType } = options;

  // If we have a file URL, try to share the file
  if (fileUrl && fileName) {
    try {
      // Fetch the file - may fail due to CORS
      const response = await fetch(fileUrl, { mode: 'cors' });
      
      if (!response.ok) {
        console.warn('Failed to fetch file for sharing:', response.status, response.statusText);
        throw new Error(`Fetch failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        console.warn('Fetched blob is empty');
        throw new Error('Empty blob');
      }
      
      // Determine actual file type from blob or passed type
      const actualType = fileType || blob.type || 'application/octet-stream';
      
      // Ensure filename has proper extension for sharing to work
      const properFileName = ensureFileExtension(fileName, actualType);
      
      console.log('Sharing file:', { properFileName, actualType, blobSize: blob.size });
      
      const file = new File([blob], properFileName, { type: actualType });

      // Check if we can share files
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        return { success: true, method: 'share' };
      } else {
        console.warn('navigator.canShare returned false for file:', properFileName, actualType);
      }
    } catch (err) {
      // If file fetch fails or share is cancelled, fall through to text share
      if ((err as Error).name === 'AbortError') {
        return { success: false, method: 'share' }; // User cancelled
      }
      console.warn('File share failed, falling back to text:', err);
    }
  }

  // Try text-only share
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return { success: true, method: 'share' };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { success: false, method: 'share' }; // User cancelled
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard' };
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return { success: false, method: 'clipboard' };
  }
}

/**
 * Build share text for a Part entry
 */
export function buildPartShareText(part: {
  name: string;
  brand?: string | null;
  part_number?: string | null;
  size_specs?: string | null;
  supplier?: string | null;
  install_date?: string | null;
  notes?: string | null;
}): string {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return [
    `🔧 ${part.name}`,
    part.brand && `Brand: ${part.brand}`,
    part.part_number && `Part #: ${part.part_number}`,
    part.size_specs && `Size/Specs: ${part.size_specs}`,
    part.supplier && `Supplier: ${part.supplier}`,
    part.install_date && `Installed: ${formatDate(part.install_date)}`,
    part.notes && `Notes: ${part.notes}`,
  ].filter(Boolean).join('\n');
}

/**
 * Build share text for a Health Check entry
 */
export function buildHealthCheckShareText(check: {
  title: string;
  check_type: string;
  date: string;
  component_name?: string | null;
  quantity?: string | null;
  notes?: string | null;
}): string {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const typeLabels: Record<string, string> = {
    oil_level: 'Oil Level Check',
    fluid_level: 'Fluid Level Check',
    grease: 'Grease Check',
    visual: 'Visual Inspection',
    other: 'Other Check',
  };
  
  return [
    `✅ ${check.title}`,
    `Type: ${typeLabels[check.check_type] || check.check_type}`,
    `Date: ${formatDate(check.date)}`,
    check.component_name && `Component: ${check.component_name}`,
    check.quantity && `Quantity: ${check.quantity}`,
    check.notes && `Notes: ${check.notes}`,
  ].filter(Boolean).join('\n');
}

/**
 * Build share text for a Document entry
 */
export function buildDocumentShareText(doc: {
  name: string;
  category: string;
  expiry_date?: string | null;
  notes?: string | null;
}): string {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const categoryLabels: Record<string, string> = {
    registration: 'Registration',
    insurance: 'Insurance',
    berth: 'Berth Contract',
    warranty: 'Warranty',
    invoice: 'Invoice',
    manual: 'Manual',
    other: 'Other',
  };
  
  return [
    `📄 ${doc.name}`,
    `Category: ${categoryLabels[doc.category] || doc.category}`,
    doc.expiry_date && `Expires: ${formatDate(doc.expiry_date)}`,
    doc.notes && `Notes: ${doc.notes}`,
  ].filter(Boolean).join('\n');
}
