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
 * Share content with optional file attachment
 * Falls back to text-only or clipboard copy if file sharing isn't supported
 */
export async function shareContent(options: ShareOptions): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'download' }> {
  const { title, text, fileUrl, fileName, fileType } = options;

  // If we have a file URL, try to share the file
  if (fileUrl && fileName) {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: fileType || blob.type || 'application/octet-stream' });

      // Check if we can share files
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        return { success: true, method: 'share' };
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
