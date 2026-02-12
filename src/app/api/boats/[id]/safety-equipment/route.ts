export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/safety-equipment - List safety equipment
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
      .select('id, engine_type')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    // Get safety equipment
    const { data: equipment, error } = await supabase
      .from('safety_equipment')
      .select('*')
      .eq('boat_id', boatId)
      .order('type', { ascending: true });

    if (error) {
      console.error('Error fetching safety equipment:', error);
      return NextResponse.json({ error: 'Failed to fetch safety equipment' }, { status: 500 });
    }

    return NextResponse.json({ 
      equipment: equipment || [],
      engineType: boat.engine_type 
    });
  } catch (error) {
    console.error('GET /api/boats/[id]/safety-equipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boats/[id]/safety-equipment - Add safety equipment
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
    const body = await request.json();
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

    // Calculate next service date if last service and interval provided
    let nextServiceDate = body.next_service_date;
    if (body.last_service_date && body.service_interval_months && !nextServiceDate) {
      const lastService = new Date(body.last_service_date);
      lastService.setMonth(lastService.getMonth() + body.service_interval_months);
      nextServiceDate = lastService.toISOString().split('T')[0];
    }

    // Insert safety equipment
    const { data: equipment, error } = await supabase
      .from('safety_equipment')
      .insert({
        boat_id: boatId,
        type: body.type,
        type_other: body.type_other,
        quantity: body.quantity || 1,
        expiry_date: body.expiry_date || null,
        last_service_date: body.last_service_date || null,
        service_interval_months: body.service_interval_months || null,
        next_service_date: nextServiceDate || null,
        certification_number: body.certification_number || null,
        notes: body.notes || null,
        photo_url: body.photo_url || null,
        voice_note_url: body.voice_note_url || null,
        created_by: dbUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating safety equipment:', error);
      return NextResponse.json({ error: 'Failed to create safety equipment' }, { status: 500 });
    }

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/boats/[id]/safety-equipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
