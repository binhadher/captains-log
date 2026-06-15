export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { saveFile } from '@/lib/local-storage';

// POST /api/upload - Upload a file
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const componentId = formData.get('component_id') as string | null;
    const logEntryId = formData.get('log_entry_id') as string | null;
    const boatId = formData.get('boat_id') as string | null;
    const category = formData.get('category') as string || 'other';
    const name = formData.get('name') as string || file.name;
    const expiryDate = formData.get('expiry_date') as string | null;
    const reminderDays = formData.get('reminder_days') as string | null;
    const notes = formData.get('notes') as string | null;
    const voiceNoteUrl = formData.get('voice_note_url') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type first to determine size limit
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/3gpp', 'video/mpeg'];
    const docTypes = ['application/pdf'];
    const allowedTypes = [...imageTypes, ...videoTypes, ...docTypes];
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const videoExts = ['mp4', 'webm', 'mov', 'm4v', '3gp'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
    const docExts = ['pdf'];
    const isVideoByExt = videoExts.includes(fileExt);
    const isImageByExt = imageExts.includes(fileExt);
    const isDocByExt = docExts.includes(fileExt);
    
    const wordExts = ['doc', 'docx'];
    if (wordExts.includes(fileExt) || file.type.includes('msword') || file.type.includes('wordprocessingml')) {
      return NextResponse.json({ 
        error: 'Word documents cannot be previewed in the app. Please convert to PDF first.' 
      }, { status: 400 });
    }
    
    if (!allowedTypes.includes(file.type) && !isVideoByExt && !isImageByExt && !isDocByExt) {
      return NextResponse.json({ error: `File type not allowed: ${file.type || 'unknown'}. Use PDF or image files.` }, { status: 400 });
    }

    const isVideo = videoTypes.includes(file.type) || isVideoByExt;
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large (max ${isVideo ? '50MB' : '10MB'})` }, { status: 400 });
    }
    
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    // Save file to local filesystem
    const { publicUrl: fileUrl } = await saveFile(file, dbUser.id, boatId || undefined);

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        boat_id: boatId || null,
        component_id: componentId || null,
        log_entry_id: logEntryId || null,
        category: category,
        name: name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        expiry_date: expiryDate || null,
        reminder_days: reminderDays ? parseInt(reminderDays) : 30,
        notes: notes || null,
        voice_note_url: voiceNoteUrl || null,
        uploaded_by: dbUser.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
