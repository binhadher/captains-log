import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/components/[id] - Get a single component with its logs and docs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // Fetch component with boat ownership check
    const { data: component, error } = await supabase
      .from('boat_components')
      .select(`
        *,
        boats!inner(id, name, owner_id)
      `)
      .eq('id', id)
      .single();

    if (error || !component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Check ownership
    if (component.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch maintenance logs for this component
    const { data: logs } = await supabase
      .from('log_entries')
      .select('*')
      .eq('component_id', id)
      .order('date', { ascending: false });

    // Fetch documents for this component (including those attached to logs)
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('component_id', id)
      .order('uploaded_at', { ascending: false });

    // Attach documents to their respective log entries
    const logsWithDocs = (logs || []).map(log => ({
      ...log,
      documents: (documents || []).filter(doc => doc.log_entry_id === log.id),
    }));

    // Documents not attached to any log entry (component-level docs)
    const componentDocs = (documents || []).filter(doc => !doc.log_entry_id);

    return NextResponse.json({ 
      component: {
        ...component,
        boats: undefined, // Remove nested boats from response
        boat_name: component.boats.name,
      },
      logs: logsWithDocs,
      documents: componentDocs,
    });
  } catch (error) {
    console.error('GET /api/components/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/components/[id] - Update a component
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // Verify ownership via boat
    const { data: existing } = await supabase
      .from('boat_components')
      .select('*, boats!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existing || existing.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const body = await request.json();

    // Update component
    const { data: component, error } = await supabase
      .from('boat_components')
      .update({
        name: body.name || existing.name,
        position: body.position ?? existing.position,
        brand: body.brand ?? existing.brand,
        model: body.model ?? existing.model,
        serial_number: body.serial_number ?? existing.serial_number,
        install_date: body.install_date ?? existing.install_date,
        current_hours: body.current_hours ?? existing.current_hours,
        notes: body.notes ?? existing.notes,
        // Service schedule fields
        scheduled_service_name: body.scheduled_service_name ?? existing.scheduled_service_name,
        service_interval_days: body.service_interval_days ?? existing.service_interval_days,
        service_interval_hours: body.service_interval_hours ?? existing.service_interval_hours,
        next_service_date: body.next_service_date ?? existing.next_service_date,
        next_service_hours: body.next_service_hours ?? existing.next_service_hours,
        last_service_date: body.last_service_date ?? existing.last_service_date,
        last_service_hours: body.last_service_hours ?? existing.last_service_hours,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating component:', error);
      return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
    }

    return NextResponse.json({ component });
  } catch (error) {
    console.error('PUT /api/components/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/components/[id] - Partial update a component
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient();
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership via boat
    const { data: existing } = await supabase
      .from('boat_components')
      .select('*, boats!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existing || existing.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'position', 'brand', 'model', 'serial_number', 
      'install_date', 'current_hours', 'notes',
      'scheduled_service_name', 'service_interval_days', 'service_interval_hours',
      'next_service_date', 'next_service_hours',
      'last_service_date', 'last_service_hours',
      // Battery fields
      'battery_count', 'battery_type', 'battery_voltage', 'battery_capacity',
      // Thruster battery fields
      'thruster_battery_count', 'thruster_battery_brand', 'thruster_battery_model', 'thruster_battery_install_date',
      // Per-engine battery data (JSONB)
      'engine_batteries',
      // Service schedule planning
      'service_schedule_notes', 'service_schedule_doc_url'
    ];
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: component, error } = await supabase
      .from('boat_components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating component:', error);
      return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
    }

    return NextResponse.json({ component });
  } catch (error) {
    console.error('PATCH /api/components/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/components/[id] - Delete a component
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // Verify ownership via boat
    const { data: existing } = await supabase
      .from('boat_components')
      .select('*, boats!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existing || existing.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Delete component (logs and docs will cascade)
    const { error } = await supabase
      .from('boat_components')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting component:', error);
      return NextResponse.json({ error: 'Failed to delete component' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/components/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
