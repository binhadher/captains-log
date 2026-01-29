import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomId}.${ext}`;
    
    // Determine storage path
    let storagePath = `users/${dbUser.id}`;
    if (boatId) storagePath += `/boats/${boatId}`;
    if (componentId) storagePath += `/components/${componentId}`;
    if (logEntryId) storagePath += `/logs/${logEntryId}`;
    storagePath += `/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL (or signed URL for private buckets)
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        boat_id: boatId || null,
        component_id: componentId || null,
        log_entry_id: logEntryId || null,
        category: category,
        name: name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        expiry_date: expiryDate || null,
        reminder_days: reminderDays ? parseInt(reminderDays) : 30,
        notes: notes || null,
        uploaded_by: dbUser.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
