import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface SearchResult {
  type: 'boat' | 'component' | 'part' | 'log';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  boatId?: string;
  boatName?: string;
}

// GET /api/search?q=query
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
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

    const results: SearchResult[] = [];

    // Search boats
    const { data: boats } = await supabase
      .from('boats')
      .select('id, name, make, model')
      .eq('owner_id', dbUser.id)
      .or(`name.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
      .limit(5);

    if (boats) {
      boats.forEach((boat) => {
        results.push({
          type: 'boat',
          id: boat.id,
          title: boat.name,
          subtitle: [boat.make, boat.model].filter(Boolean).join(' ') || undefined,
          url: `/boats/${boat.id}`,
        });
      });
    }

    // Get user's boat IDs for filtering components/parts
    const { data: userBoats } = await supabase
      .from('boats')
      .select('id, name')
      .eq('owner_id', dbUser.id);

    const boatIds = userBoats?.map((b) => b.id) || [];
    const boatMap = new Map(userBoats?.map((b) => [b.id, b.name]) || []);

    if (boatIds.length > 0) {
      // Search components
      const { data: components } = await supabase
        .from('boat_components')
        .select('id, boat_id, name, brand, model, type')
        .in('boat_id', boatIds)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
        .limit(5);

      if (components) {
        components.forEach((comp) => {
          results.push({
            type: 'component',
            id: comp.id,
            title: comp.name,
            subtitle: [comp.brand, comp.model].filter(Boolean).join(' ') || boatMap.get(comp.boat_id),
            url: `/boats/${comp.boat_id}/components/${comp.id}`,
            boatId: comp.boat_id,
            boatName: boatMap.get(comp.boat_id),
          });
        });
      }

      // Search parts
      const { data: parts } = await supabase
        .from('parts_catalog')
        .select('id, boat_id, name, brand, part_number')
        .in('boat_id', boatIds)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,part_number.ilike.%${query}%`)
        .limit(5);

      if (parts) {
        parts.forEach((part) => {
          results.push({
            type: 'part',
            id: part.id,
            title: part.name,
            subtitle: [part.brand, part.part_number].filter(Boolean).join(' - ') || boatMap.get(part.boat_id),
            url: `/boats/${part.boat_id}`,
            boatId: part.boat_id,
            boatName: boatMap.get(part.boat_id),
          });
        });
      }

      // Search maintenance logs
      const { data: logs } = await supabase
        .from('maintenance_logs')
        .select('id, boat_id, component_id, description, notes')
        .in('boat_id', boatIds)
        .or(`description.ilike.%${query}%,notes.ilike.%${query}%`)
        .limit(5);

      if (logs) {
        logs.forEach((log) => {
          results.push({
            type: 'log',
            id: log.id,
            title: log.description || 'Maintenance log',
            subtitle: boatMap.get(log.boat_id),
            url: log.component_id 
              ? `/boats/${log.boat_id}/components/${log.component_id}`
              : `/boats/${log.boat_id}`,
            boatId: log.boat_id,
            boatName: boatMap.get(log.boat_id),
          });
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
