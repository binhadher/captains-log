export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createServerClient } from '@/lib/supabase';
import { ensureUploadDir, UPLOAD_DIR } from '@/lib/local-storage';

// PUT /api/upload/direct?path=users/{userId}/.../{filename}
// Accepts a raw file body and writes it to the local upload directory.
// Used by the signed-url flow for files > 4MB (gallery, boat hero, component docs).
export async function PUT(request: NextRequest) {
  return handleDirectUpload(request);
}

export async function POST(request: NextRequest) {
  return handleDirectUpload(request);
}

async function handleDirectUpload(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let relativePath = searchParams.get('path') || '';

    // Fallback for legacy query-string format (file + userId + boatId ...)
    if (!relativePath) {
      const userIdParam = searchParams.get('userId');
      const boatId = searchParams.get('boatId');
      const componentId = searchParams.get('componentId');
      const logEntryId = searchParams.get('logEntryId');
      const file = searchParams.get('file');

      if (!userIdParam || !file) {
        return NextResponse.json({ error: 'Missing upload path' }, { status: 400 });
      }

      relativePath = `users/${userIdParam}`;
      if (boatId) relativePath += `/boats/${boatId}`;
      if (componentId) relativePath += `/components/${componentId}`;
      if (logEntryId) relativePath += `/logs/${logEntryId}`;
      relativePath += `/${file}`;
    }

    const supabase = createServerClient();
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Path must belong to the authenticated user
    const expectedPrefix = `users/${dbUser.id}/`;
    if (!relativePath.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 403 });
    }

    // Prevent directory traversal
    const normalized = path.normalize(relativePath);
    if (normalized.startsWith('..') || normalized.includes('../')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    ensureUploadDir();
    const fullDir = path.join(UPLOAD_DIR, path.dirname(normalized));
    fs.mkdirSync(fullDir, { recursive: true });

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }

    const fullPath = path.join(UPLOAD_DIR, normalized);
    fs.writeFileSync(fullPath, buffer);
    fs.chmodSync(fullPath, 0o644);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae';
    const publicUrl = `${appUrl}/uploads/${normalized}`;

    return NextResponse.json({ publicUrl, path: normalized }, { status: 200 });
  } catch (error) {
    console.error('Direct upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
