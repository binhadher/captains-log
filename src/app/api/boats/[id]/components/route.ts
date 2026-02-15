export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/components - List components for a boat
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

    // Verify boat ownership OR crew access
    const { data: boat } = await supabase
      .from('boats')
      .select('id, owner_id')
      .eq('id', boatId)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Check if user is owner or has crew access
    const isOwner = boat.owner_id === dbUser.id;
    if (!isOwner) {
      const { data: crewAccess } = await supabase
        .from('boat_users')
        .select('id')
        .eq('boat_id', boatId)
        .eq('user_id', userId)
        .single();
      
      if (!crewAccess) {
        return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
      }
    }

    // Fetch components
    const { data: components, error } = await supabase
      .from('boat_components')
      .select('*')
      .eq('boat_id', boatId)
      .order('category')
      .order('sort_order')
      .order('name');

    if (error) {
      console.error('Error fetching components:', error);
      return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 });
    }

    return NextResponse.json({ components });
  } catch (error) {
    console.error('GET /api/boats/[id]/components error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats/[id]/components - Create a new component
export async function POST(
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

    const body = await request.json();

    // Validate required fields
    if (!body.category || !body.type || !body.name) {
      return NextResponse.json({ error: 'Category, type, and name are required' }, { status: 400 });
    }

    // Get next sort order
    const { data: lastComponent } = await supabase
      .from('boat_components')
      .select('sort_order')
      .eq('boat_id', boatId)
      .eq('category', body.category)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastComponent?.sort_order || 0) + 1;

    // Create component
    const { data: component, error } = await supabase
      .from('boat_components')
      .insert({
        boat_id: boatId,
        category: body.category,
        type: body.type,
        name: body.name,
        position: body.position || null,
        brand: body.brand || null,
        model: body.model || null,
        serial_number: body.serial_number || null,
        install_date: body.install_date || null,
        current_hours: body.current_hours || 0,
        notes: body.notes || null,
        sort_order: sortOrder,
        // Battery fields
        battery_count: body.battery_count || null,
        battery_type: body.battery_type || null,
        battery_voltage: body.battery_voltage || null,
        battery_capacity: body.battery_capacity || null,
        // Thruster battery fields
        thruster_battery_count: body.thruster_battery_count || null,
        thruster_battery_brand: body.thruster_battery_brand || null,
        thruster_battery_model: body.thruster_battery_model || null,
        thruster_battery_install_date: body.thruster_battery_install_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating component:', error);
      return NextResponse.json({ error: 'Failed to create component' }, { status: 500 });
    }

    return NextResponse.json({ component }, { status: 201 });
  } catch (error) {
    console.error('POST /api/boats/[id]/components error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats/[id]/components/bulk - Create multiple components at once
export async function PUT(
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

    const { components: componentsList } = await request.json();

    if (!Array.isArray(componentsList) || componentsList.length === 0) {
      return NextResponse.json({ error: 'Components array is required' }, { status: 400 });
    }

    // Prepare components with boat_id
    const componentsToInsert = componentsList.map((comp, index) => ({
      boat_id: boatId,
      category: comp.category,
      type: comp.type,
      name: comp.name,
      position: comp.position || null,
      brand: comp.brand || null,
      model: comp.model || null,
      serial_number: comp.serial_number || null,
      install_date: comp.install_date || null,
      current_hours: comp.current_hours || 0,
      notes: comp.notes || null,
      sort_order: comp.sort_order || index,
    }));

    // Insert all components
    const { data: components, error } = await supabase
      .from('boat_components')
      .insert(componentsToInsert)
      .select();

    if (error) {
      console.error('Error creating components:', error);
      return NextResponse.json({ error: 'Failed to create components' }, { status: 500 });
    }

    return NextResponse.json({ components }, { status: 201 });
  } catch (error) {
    console.error('PUT /api/boats/[id]/components error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
