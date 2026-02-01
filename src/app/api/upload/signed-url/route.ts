import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/upload/signed-url - Get a signed URL for direct upload to Supabase
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, boatId, componentId, logEntryId } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType required' }, { status: 400 });
    }

    // Validate file size (50MB for videos, 10MB for others)
    const isVideo = fileType.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json({ error: `File too large (max ${isVideo ? '50MB' : '10MB'})` }, { status: 400 });
    }

    // Generate unique filename
    const ext = fileName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `${timestamp}-${randomId}.${ext}`;
    
    // Determine storage path
    let storagePath = `users/${dbUser.id}`;
    if (boatId) storagePath += `/boats/${boatId}`;
    if (componentId) storagePath += `/components/${componentId}`;
    if (logEntryId) storagePath += `/logs/${logEntryId}`;
    storagePath += `/${uniqueFileName}`;

    // Create signed upload URL (valid for 5 minutes)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
      console.error('Signed URL error:', signedError);
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
    }

    // Get the public URL for after upload
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: storagePath,
      publicUrl: urlData.publicUrl,
      dbUserId: dbUser.id,
    });

  } catch (error) {
    console.error('POST /api/upload/signed-url error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
