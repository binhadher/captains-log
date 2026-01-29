import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/documents - Get documents for a boat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
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

    // Verify boat ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('id')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Get boat-level documents (not linked to components or log entries)
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('boat_id', boatId)
      .is('component_id', null)
      .is('log_entry_id', null)
      .order('category')
      .order('name');

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error('GET /api/boats/[id]/documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boats/[id]/documents?docId=xxx - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
    const docId = request.nextUrl.searchParams.get('docId');
    
    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
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

    // Verify boat ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('id')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Get document to find the file path
    const { data: doc } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', docId)
      .eq('boat_id', boatId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage (extract path from URL)
    if (doc.file_url) {
      const url = new URL(doc.file_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/documents/');
      if (pathParts.length > 1) {
        await supabase.storage.from('documents').remove([pathParts[1]]);
      }
    }

    // Delete document record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('boat_id', boatId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/boats/[id]/documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
