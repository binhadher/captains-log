export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { saveFile } from '@/lib/local-storage';

// POST /api/upload/signed-url - Get a signed URL for direct upload (large files)
// For files > 4MB on VPS, we handle locally
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileType, fileSize, name, componentId, logEntryId, boatId, category, notes } = await request.json();

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://captainslog.ae';
    const publicUrl = `${appUrl}/api/upload/direct?file=${filename}&userId=${dbUser.id}&boatId=${boatId || ''}&componentId=${componentId || ''}&logEntryId=${logEntryId || ''}&category=${category || 'other'}&name=${encodeURIComponent(name)}`;

    return NextResponse.json({
      url: publicUrl,
      filePath: `users/${dbUser.id}/boats/${boatId || 'unknown'}/${filename}`,
      publicUrl: publicUrl,
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
