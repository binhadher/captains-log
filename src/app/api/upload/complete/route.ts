export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/upload/complete - Create document record after direct upload
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
    const { 
      publicUrl, 
      fileName, 
      fileType, 
      fileSize, 
      boatId, 
      componentId, 
      logEntryId,
      category = 'other',
      expiryDate,
      reminderDays,
      notes
    } = body;

    if (!publicUrl || !fileName) {
      return NextResponse.json({ error: 'publicUrl and fileName required' }, { status: 400 });
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        boat_id: boatId || null,
        component_id: componentId || null,
        log_entry_id: logEntryId || null,
        category: category,
        name: fileName,
        file_url: publicUrl,
        file_type: fileType || 'application/octet-stream',
        file_size: fileSize || 0,
        expiry_date: expiryDate || null,
        reminder_days: reminderDays ? parseInt(reminderDays) : 30,
        notes: notes || null,
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
    console.error('POST /api/upload/complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
