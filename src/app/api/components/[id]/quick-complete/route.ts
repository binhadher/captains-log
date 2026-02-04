import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/components/[id]/quick-complete - Quick complete service and update next date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { alertType, serviceName } = body;

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
    const { data: component, error: fetchError } = await supabase
      .from('boat_components')
      .select(`
        *,
        boats!inner(id, owner_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    // Check ownership
    if (component.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Create a maintenance log entry
    const { error: logError } = await supabase
      .from('log_entries')
      .insert({
        boat_id: component.boat_id,
        component_id: id,
        maintenance_item: component.scheduled_service_name || serviceName || 'Service',
        date: today,
        description: `Quick completed from alerts`,
        hours_at_service: component.current_hours || null,
        created_by: dbUser.id,
        currency: 'AED',
      });

    if (logError) {
      console.error('Error creating log:', logError);
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }

    // Update component with last service info and calculate next service
    const updates: Record<string, unknown> = {
      last_service_date: today,
      last_service_hours: component.current_hours || null,
    };

    // Calculate next service date/hours based on interval
    if (alertType === 'maintenance_date' || component.service_interval_days) {
      if (component.service_interval_days) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + component.service_interval_days);
        updates.next_service_date = nextDate.toISOString().split('T')[0];
      }
    }

    if (alertType === 'maintenance_hours' || component.service_interval_hours) {
      if (component.service_interval_hours && component.current_hours) {
        updates.next_service_hours = component.current_hours + component.service_interval_hours;
      }
    }

    // Update component
    const { error: updateError } = await supabase
      .from('boat_components')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating component:', updateError);
      return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('POST /api/components/[id]/quick-complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
