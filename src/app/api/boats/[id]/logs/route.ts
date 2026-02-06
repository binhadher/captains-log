import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/logs - Get all maintenance logs for a boat (for PDF export)
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
      .select('id, owner_id')
      .eq('id', boatId)
      .single();

    if (!boat || boat.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Fetch all logs for this boat with component names
    const { data: logs, error } = await supabase
      .from('log_entries')
      .select(`
        id,
        maintenance_item,
        date,
        description,
        cost,
        currency,
        hours_at_service,
        notes,
        created_at,
        boat_components (
          name
        )
      `)
      .eq('boat_id', boatId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Flatten component name
    const formattedLogs = (logs || []).map(log => ({
      ...log,
      component_name: log.boat_components?.name || null,
      boat_components: undefined,
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('GET /api/boats/[id]/logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
