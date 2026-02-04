import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/components/[id]/documents - Get documents for a component
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: componentId } = await params;
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

    // Get the component and verify ownership through boat
    const { data: component } = await supabase
      .from('boat_components')
      .select('id, boat_id, boats!inner(owner_id)')
      .eq('id', componentId)
      .single();

    if (!component || (component as any).boats?.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Get documents for this component
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('component_id', componentId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching component documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error('GET /api/components/[id]/documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/components/[id]/documents - Add a document to a component
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: componentId } = await params;
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

    // Get the component and verify ownership through boat
    const { data: component } = await supabase
      .from('boat_components')
      .select('id, boat_id, boats!inner(owner_id)')
      .eq('id', componentId)
      .single();

    if (!component || (component as any).boats?.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const body = await request.json();

    // Create document record
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        boat_id: component.boat_id,
        component_id: componentId,
        category: body.category || 'other',
        name: body.name,
        file_url: body.file_url,
        file_type: body.file_type || 'application/octet-stream',
        file_size: body.file_size || 0,
        notes: body.notes || null,
        uploaded_by: dbUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('POST /api/components/[id]/documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/components/[id]/documents?docId=xxx - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: componentId } = await params;
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

    // Get the component and verify ownership through boat
    const { data: component } = await supabase
      .from('boat_components')
      .select('id, boat_id, boats!inner(owner_id)')
      .eq('id', componentId)
      .single();

    if (!component || (component as any).boats?.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Delete the document
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('component_id', componentId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/components/[id]/documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
