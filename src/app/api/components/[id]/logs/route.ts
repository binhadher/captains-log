import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/components/[id]/logs - Get maintenance logs for a component
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

    // Verify component access via boat ownership
    const { data: component } = await supabase
      .from('boat_components')
      .select('*, boats!inner(owner_id)')
      .eq('id', componentId)
      .single();

    if (!component || component.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Fetch logs
    const { data: logs, error } = await supabase
      .from('log_entries')
      .select('*')
      .eq('component_id', componentId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('GET /api/components/[id]/logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/components/[id]/logs - Create a maintenance log
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

    // Verify component access and get boat_id
    const { data: component } = await supabase
      .from('boat_components')
      .select('*, boats!inner(id, owner_id)')
      .eq('id', componentId)
      .single();

    if (!component || component.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.maintenance_item) {
      return NextResponse.json({ error: 'Maintenance item is required' }, { status: 400 });
    }

    // Create log entry
    const { data: log, error } = await supabase
      .from('log_entries')
      .insert({
        boat_id: component.boat_id,
        component_id: componentId,
        maintenance_item: body.maintenance_item,
        date: body.date || new Date().toISOString().split('T')[0],
        description: body.description || '',
        cost: body.cost || null,
        currency: body.currency || 'AED',
        hours_at_service: body.hours_at_service || null,
        notes: body.notes || null,
        created_by: dbUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating log:', error);
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }

    // Update component with service info
    const updates: Record<string, unknown> = {
      last_service_date: body.date || new Date().toISOString().split('T')[0],
    };

    // Update component hours if provided
    if (body.hours_at_service && body.hours_at_service > (component.current_hours || 0)) {
      updates.current_hours = body.hours_at_service;
      updates.last_service_hours = body.hours_at_service;
    }

    // Calculate next service date based on interval
    if (component.service_interval_days) {
      const serviceDate = new Date(body.date || new Date());
      serviceDate.setDate(serviceDate.getDate() + component.service_interval_days);
      updates.next_service_date = serviceDate.toISOString().split('T')[0];
    } else {
      // No interval set - clear any existing due date since service was completed
      updates.next_service_date = null;
    }

    // Calculate next service hours based on interval
    if (component.service_interval_hours) {
      const currentHours = body.hours_at_service || component.current_hours || 0;
      updates.next_service_hours = currentHours + component.service_interval_hours;
    } else {
      // No interval set - clear any existing hours threshold
      updates.next_service_hours = null;
    }

    // Apply updates to component
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('boat_components')
        .update(updates)
        .eq('id', componentId);
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('POST /api/components/[id]/logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
