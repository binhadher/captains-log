import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/opt/captainslog/uploads';

// Ensure the upload directory exists
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Save a file to local storage, return the public URL path
export async function saveFile(
  file: File,
  userId: string,
  boatId?: string,
): Promise<{ filePath: string; publicUrl: string }> {
  ensureUploadDir();

  // Create user/boat subdirectory
  let relativeDir = `users/${userId}`;
  if (boatId) relativeDir += `/boats/${boatId}`;
  
  const fullDir = path.join(UPLOAD_DIR, relativeDir);
  fs.mkdirSync(fullDir, { recursive: true });

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomId}.${ext}`;
  
  const relativePath = `${relativeDir}/${filename}`;
  const fullPath = path.join(UPLOAD_DIR, relativePath);

  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buffer);
  
  // Set permissions so nginx can serve it
  fs.chmodSync(fullPath, 0o644);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae';
  const publicUrl = `${appUrl}/uploads/${relativePath}`;

  return { filePath: relativePath, publicUrl };
}

// Delete a file by its relative path
export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

// Delete a file by its URL (parsed from public URL)
export async function deleteFileByUrl(publicUrl: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae';
  const relativePath = publicUrl.replace(`${appUrl}/uploads/`, '');
  if (relativePath && relativePath !== publicUrl) {
    await deleteFile(relativePath);
  }
}
