import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface ActivityItem {
  id: string;
  type: 'maintenance' | 'health_check' | 'document';
  title: string;
  description?: string;
  date: string;
  boatId: string;
  boatName: string;
  componentId?: string;
  componentName?: string;
  cost?: number;
  currency?: string;
}

// GET /api/activity - Get recent activity across all user's boats
export async function GET(request: NextRequest) {
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

    // Get all user's boats
    const { data: boats } = await supabase
      .from('boats')
      .select('id, name')
      .eq('owner_id', dbUser.id);

    if (!boats || boats.length === 0) {
      return NextResponse.json({ activity: [] });
    }

    const boatIds = boats.map(b => b.id);
    const boatMap = Object.fromEntries(boats.map(b => [b.id, b.name]));
    
    const activity: ActivityItem[] = [];

    // Get recent maintenance logs (last 30 days or last 20 entries)
    const { data: logs } = await supabase
      .from('log_entries')
      .select(`
        id,
        boat_id,
        component_id,
        maintenance_item,
        description,
        date,
        cost,
        currency,
        boat_components (name)
      `)
      .in('boat_id', boatIds)
      .order('date', { ascending: false })
      .limit(20);

    if (logs) {
      for (const log of logs) {
        // Handle Supabase join - can return object or array depending on relationship
        const component = log.boat_components as { name: string } | { name: string }[] | null;
        const componentName = Array.isArray(component) 
          ? component[0]?.name 
          : component?.name;
        
        activity.push({
          id: `log-${log.id}`,
          type: 'maintenance',
          title: log.maintenance_item,
          description: log.description || undefined,
          date: log.date,
          boatId: log.boat_id,
          boatName: boatMap[log.boat_id],
          componentId: log.component_id || undefined,
          componentName: componentName || undefined,
          cost: log.cost || undefined,
          currency: log.currency || undefined,
        });
      }
    }

    // Get recent health checks
    const { data: checks } = await supabase
      .from('health_checks')
      .select(`
        id,
        boat_id,
        component_id,
        title,
        check_type,
        quantity,
        date,
        boat_components (name)
      `)
      .in('boat_id', boatIds)
      .order('date', { ascending: false })
      .limit(10);

    if (checks) {
      for (const check of checks) {
        // Handle Supabase join - can return object or array depending on relationship
        const component = check.boat_components as { name: string } | { name: string }[] | null;
        const componentName = Array.isArray(component) 
          ? component[0]?.name 
          : component?.name;
        
        activity.push({
          id: `check-${check.id}`,
          type: 'health_check',
          title: check.title,
          description: check.quantity ? `Quantity: ${check.quantity}` : undefined,
          date: check.date,
          boatId: check.boat_id,
          boatName: boatMap[check.boat_id],
          componentId: check.component_id || undefined,
          componentName: componentName || undefined,
        });
      }
    }

    // Get recent document uploads (last 10)
    const { data: docs } = await supabase
      .from('documents')
      .select('id, boat_id, name, category, uploaded_at')
      .in('boat_id', boatIds)
      .order('uploaded_at', { ascending: false })
      .limit(10);

    if (docs) {
      for (const doc of docs) {
        activity.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: `Uploaded: ${doc.name}`,
          description: doc.category.charAt(0).toUpperCase() + doc.category.slice(1),
          date: doc.uploaded_at.split('T')[0],
          boatId: doc.boat_id,
          boatName: boatMap[doc.boat_id],
        });
      }
    }

    // Sort all activity by date, most recent first
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return top 15 items
    return NextResponse.json({ activity: activity.slice(0, 15) });
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
