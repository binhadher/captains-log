export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/upload/signed-url - Get a signed URL for direct upload (large files)
// For files > 4MB on VPS, we handle locally
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fileType = body.fileType;
    const name = body.name || body.fileName;
    const { componentId, logEntryId, boatId } = body;

    if (!fileType || !name) {
      return NextResponse.json({ error: 'File type and name are required' }, { status: 400 });
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

    // For VPS local storage, we generate a direct upload URL that the client can use
    const ext = name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomId}.${ext}`;

    // Build the same relative path shape that /uploads/ nginx location serves
    let relativeDir = `users/${dbUser.id}`;
    if (boatId) relativeDir += `/boats/${boatId}`;
    if (componentId) relativeDir += `/components/${componentId}`;
    if (logEntryId) relativeDir += `/logs/${logEntryId}`;
    const relativePath = `${relativeDir}/${filename}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae';
    const signedUrl = `${appUrl}/api/upload/direct?path=${encodeURIComponent(relativePath)}`;
    const publicUrl = `${appUrl}/uploads/${relativePath}`;

    return NextResponse.json({
      signedUrl,
      publicUrl,
      filePath: relativePath,
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
