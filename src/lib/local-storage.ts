import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || '/opt/captainslog/uploads';

// Ensure the upload directory exists
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Optimize images with sharp while preserving visual quality.
// Original is kept as <filename>.original.<ext> for rollback if needed.
async function optimizeImageIfNeeded(
  fullPath: string,
  mimeType: string
): Promise<number> {
  try {
    // Only process raster images
    if (!mimeType.startsWith('image/')) {
      return fs.statSync(fullPath).size;
    }

    const stats = fs.statSync(fullPath);
    const originalSize = stats.size;

    // Skip small files that are already reasonable
    if (originalSize < 500 * 1024) {
      return originalSize;
    }

    const metadata = await sharp(fullPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Skip if already reasonably small dimensions
    if (originalSize < 1024 * 1024 && width <= 2560 && height <= 2560) {
      return originalSize;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const originalPath = `${fullPath}.original${ext}`;

    // Keep original backup
    fs.copyFileSync(fullPath, originalPath);

    let transformer = sharp(fullPath);

    // Resize if any dimension exceeds 2560px (preserves aspect ratio)
    if (width > 2560 || height > 2560) {
      transformer = transformer.resize({
        width: 2560,
        height: 2560,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // High-quality output to keep text/brand names readable
    let optimizedBuffer: Buffer;
    if (mimeType === 'image/png' || ext === '.png') {
      const hasAlpha = metadata.hasAlpha;
      if (hasAlpha) {
        // Keep PNG if transparency is needed
        optimizedBuffer = await transformer
          .png({ compressionLevel: 9, quality: 95 })
          .toBuffer();
      } else {
        // Convert opaque PNG to high-quality JPEG
        optimizedBuffer = await transformer
          .jpeg({ quality: 95, progressive: true, mozjpeg: true })
          .toBuffer();
      }
    } else if (mimeType === 'image/webp' || ext === '.webp') {
      optimizedBuffer = await transformer
        .webp({ quality: 90, effort: 4 })
        .toBuffer();
    } else {
      // JPEG and other images
      optimizedBuffer = await transformer
        .jpeg({ quality: 90, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    // Only keep optimized version if it actually saved space
    if (optimizedBuffer.length < originalSize * 0.95) {
      fs.writeFileSync(fullPath, optimizedBuffer);
      fs.chmodSync(fullPath, 0o644);
      return optimizedBuffer.length;
    } else {
      // Remove backup if no meaningful savings
      fs.unlinkSync(originalPath);
      return originalSize;
    }
  } catch (err) {
    console.error('Image optimization failed, keeping original:', err);
    return fs.statSync(fullPath).size;
  }
}

// Save a file to local storage, return the public URL path
export async function saveFile(
  file: File,
  userId: string,
  boatId?: string,
): Promise<{ filePath: string; publicUrl: string; fileSize: number }> {
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

  // Optimize images without quality loss
  const finalSize = await optimizeImageIfNeeded(fullPath, file.type || '');

  // Set permissions so nginx can serve it
  fs.chmodSync(fullPath, 0o644);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae';
  const publicUrl = `${appUrl}/uploads/${relativePath}`;

  return { filePath: relativePath, publicUrl, fileSize: finalSize };
}

// Delete a file by its relative path
export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  // Also delete any original backup
  const ext = path.extname(fullPath);
  const originalPath = `${fullPath}.original${ext}`;
  if (fs.existsSync(originalPath)) {
    fs.unlinkSync(originalPath);
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
