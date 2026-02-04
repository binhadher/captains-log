import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/components/[id]/dismiss-alert - Dismiss an alert by pushing next service date forward
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
    const { alertType } = body; // 'maintenance_date' or 'maintenance_hours'

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

    // Calculate new next service date/hours based on interval
    const updates: Record<string, unknown> = {};

    if (alertType === 'maintenance_date' && component.service_interval_days) {
      // Push the next service date forward by the interval from today
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + component.service_interval_days);
      updates.next_service_date = newDate.toISOString().split('T')[0];
    } else if (alertType === 'maintenance_hours' && component.service_interval_hours && component.current_hours) {
      // Push next service hours forward from current hours
      updates.next_service_hours = component.current_hours + component.service_interval_hours;
    } else {
      // No interval set, just clear the next service date/hours
      if (alertType === 'maintenance_date') {
        updates.next_service_date = null;
      } else {
        updates.next_service_hours = null;
      }
    }

    // Update component
    const { error: updateError } = await supabase
      .from('boat_components')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating component:', updateError);
      return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('POST /api/components/[id]/dismiss-alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
